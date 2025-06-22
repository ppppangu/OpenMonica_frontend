<script setup lang="ts">
import {
  SearchOutlined,
  CloudUploadOutlined,
  PaperClipOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";
import { Button, Divider, Flex, Switch, theme, message } from "ant-design-vue";
import { Sender, Attachments } from "ant-design-x-vue";
import { ref, watch, h, computed, onMounted, onUnmounted } from "vue";
import ModelList from "./model_list.vue";
import FileUploadWidget from "./FileUploadWidget.vue";
import VoiceInput from "./VoiceInput.vue";
import { useUserInputStore } from "../store/user_input";
import { useModelListStore } from "../store/model_list";
import { useUserStore } from "../store/user_info";
import { useFileAttachmentsStore } from "../store/file_attachments";
import { useChatHistoryStore } from "../store/chat_history";
import { useChatHistoryContentStore } from "../store/chat_history_content";
import { useToolCallsStore } from "../store/tool_calls";

defineOptions({ name: "ChatFrame" });

const { token } = theme.useToken();
const loading = ref<boolean>(false);
const value = ref<string>("");
const userInputStore = useUserInputStore();
const modelListStore = useModelListStore();
const userStore = useUserStore();
const fileAttachmentsStore = useFileAttachmentsStore();
const chatContentStore = useChatHistoryContentStore();
const chatHistoryStore = useChatHistoryStore();
const toolCallsStore = useToolCallsStore();

const open = ref(false);
const attachmentsRef = ref(null);

// 移除高度计算相关的refs和逻辑，因为现在在文档流中不需要手动计算高度

// Convert file attachments to Ant Design X format
const attachmentItems = computed(() => {
  return fileAttachmentsStore.attachments.map((attachment) => ({
    uid: attachment.file_id,
    name: attachment.filename,
    status: attachment.upload_status,
    size: attachment.file_size,
    url: attachment.public_url,
    thumbUrl:
      attachment.file_type === "image" ? attachment.public_url : undefined,
    percent: attachment.upload_progress,
    response: attachment.error_message,
  }));
});

// Computed property for upload status
const uploadStatus = computed(() => fileAttachmentsStore.getUploadStatus());

// Computed property to check if sending should be disabled
const isSendDisabled = computed(() => {
  const hasText = value.value.trim().length > 0;
  const hasAttachments = fileAttachmentsStore.attachments.length > 0;
  const hasUploading = uploadStatus.value.hasUploading;

  // Disable if no content OR if files are still uploading
  return (!hasText && !hasAttachments) || hasUploading;
});

const placeholder = (type: "inline" | "drop") =>
  type === "drop"
    ? {
        title: "Drop file here",
      }
    : {
        icon: h(CloudUploadOutlined),
        title: "Click or drag files to upload",
        description: "Support file type: image, video, audio, document, etc.",
      };

// Handle custom request for Ant Design Upload
const handleCustomRequest = async (options: any) => {
  console.log("🔄 handleCustomRequest called with:", {
    fileName: options.file?.name,
    fileSize: options.file?.size,
    fileType: options.file?.type,
  });

  try {
    const result = await fileAttachmentsStore.uploadFile(options.file);
    console.log("✅ File upload successful:", result);
    message.success(`${options.file.name} uploaded successfully`);
    options.onSuccess?.(result, options.file);
  } catch (error) {
    console.error("❌ File upload error:", error);
    message.error(
      `Failed to upload ${options.file.name}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    options.onError?.(error);
  }
};

// Handle file removal
const handleFileRemove = (file: any) => {
  fileAttachmentsStore.removeFileFromStore(file.uid);
  message.success(`${file.name} removed`);
  return false; // Prevent default removal behavior
};

// Handle file change events
const handleFileChange = ({ fileList }: { fileList: any[] }) => {
  // This is handled by our custom upload logic
  console.log("File list changed:", fileList);
};

const iconStyle = {
  fontSize: 18,
  color: token.value.colorText,
};

// 监听聊天框，用户输入文字时，将文字赋值给userInputStore.user_input.text
watch(value, (newVal) => {
  userInputStore.update_user_input("text", newVal);
  console.log("userInputStore.user_input.text", userInputStore.user_input.text);
});

// 监听文件附件变化，同步到用户输入store
watch(
  () => fileAttachmentsStore.image_urls,
  (newImages) => {
    userInputStore.update_user_input("images", newImages);
  },
  { deep: true }
);

watch(
  () => fileAttachmentsStore.file_urls,
  (newFiles) => {
    userInputStore.update_user_input("file_list", newFiles);
  },
  { deep: true }
);

async function handleSendChat() {
  // 1. 立即显示用户消息在右侧聊天气泡
  const userMessage = userInputStore.user_input.text.trim();
  const hasAttachments = fileAttachmentsStore.attachments.length > 0;

  // Validate that we have either text or attachments
  if (!userMessage && !hasAttachments) {
    console.warn("No message text or file attachments to send");
    return;
  }

  // Prepare message content with file attachments
  let messageContent = userMessage;
  if (hasAttachments) {
    const attachmentUrls = fileAttachmentsStore.attachments
      .filter((att) => att.upload_status === "done")
      .map((att) => att.public_url);

    if (attachmentUrls.length > 0) {
      console.log("Including file attachments in message:", attachmentUrls);
      // Add file URLs to the message content for reference
      const fileReferences = attachmentUrls
        .map((url) => `[File: ${url}]`)
        .join("\n");
      messageContent = userMessage
        ? `${userMessage}\n\n${fileReferences}`
        : fileReferences;
    }
  }

  if (messageContent) {
    chatContentStore.addUserMessage(messageContent);

    // Clear input immediately after capturing the message
    value.value = "";
    userInputStore.update_user_input("text", "");

    // 2. 开始AI流式响应
    chatContentStore.startStreamingResponse();

    // 3. 发送聊天请求并处理流式响应
    try {
      await sendChatWithStreaming(userMessage);
    } catch (error) {
      console.error("Chat sending failed:", error);
      chatContentStore.finishStreamingResponse();
    }
  }

  // Clear attachments after sending
  fileAttachmentsStore.clearAllAttachments();
  // Close attachments panel
  open.value = false;
}

// 新增：处理流式聊天响应的函数
async function sendChatWithStreaming(userMessage: string) {
  const userStore = useUserStore();
  const modelListStore = useModelListStore();

  // Get user_id from global state
  const userId = userStore.user?.id;
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get token for authentication
  const token = userStore.user?.token;
  if (!token) {
    throw new Error("Authentication token not found");
  }

  // Get current model
  const modelId = modelListStore.current_model?.model_id;
  if (!modelId) {
    throw new Error("No model selected");
  }

  // Get current session_id
  console.log(
    "chatHistoryStore.activeChatHistoryItem:",
    chatHistoryStore.activeChatHistoryItem
  );
  const sessionId = chatHistoryStore.activeChatHistoryItem?.session_id;
  console.log("获取到的sessionId:", sessionId);
  if (!sessionId) {
    throw new Error("No active chat session");
  }

  // Prepare form data
  const formData = new FormData();
  formData.append("token", token);
  formData.append("user_id", userId);
  formData.append("session_id", sessionId);
  formData.append("model_id", modelId);
  formData.append(
    "user_message_list",
    JSON.stringify([
      {
        role: "user",
        content: userMessage,
      },
    ])
  );
  formData.append("extra_request_list", JSON.stringify([]));

  // Send request and handle streaming response
  const response = await fetch("/user/chat", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Check if response is streaming (SSE)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/event-stream")) {
    // Handle SSE streaming
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      try {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("=== 流式读取完成 ===");
            break;
          }

          const chunk = decoder.decode(value);

          // 详细日志：记录每个接收到的原始数据块
          console.log("=== 前端接收原始数据块 ===");
          console.log("原始字节长度:", value.length);
          console.log("解码后长度:", chunk.length);
          console.log("解码内容 (JSON):", JSON.stringify(chunk));
          console.log("解码内容 (可读):", chunk);
          console.log("当前缓冲区长度:", buffer.length);

          buffer += chunk;

          console.log("合并后缓冲区长度:", buffer.length);
          console.log("=== 原始数据块处理完成 ===\n");

          // 使用测试工具验证成功的解析算法
          //
          // 【重要】两次经验教训总结：
          // 第一次教训：必须正确解析JSON来提取content字段，不能直接使用原始SSE数据
          //   - 错误做法：直接使用 `data:` 后的内容 → 导致显示 `{"content": "\n"}` 而不是换行符
          //   - 正确做法：JSON.parse() 解析后提取 jsonData.content
          //
          // 第二次教训：遇到非SSE格式行不能停止处理，要继续处理后续data:行
          //   - 错误做法：遇到非 `data:` 开头的行就 break 停止处理
          //   - 正确做法：跳过非SSE格式行，继续处理后续的 `data:` 行
          //
          // 综合解决方案：逐行处理 + JSON解析 + 跳过非SSE行 = 完美解决换行符显示问题
          //
          console.log("=== 前端SSE解析开始 ===");
          console.log("当前缓冲区内容:", JSON.stringify(buffer));
          console.log("缓冲区长度:", buffer.length);

          // 解析SSE数据 - 完全基于测试工具成功的算法
          let parsedContent = "";

          // 按行分割，但要小心处理包含换行符的JSON
          const lines = buffer.split("\n");
          let i = 0;
          let processedLines = 0;

          while (i < lines.length) {
            const line = lines[i];
            console.log(`处理第 ${i} 行:`, JSON.stringify(line));

            if (line.startsWith("data: ")) {
              let dataContent = line.substring(6);
              console.log("提取data内容:", JSON.stringify(dataContent));

              // 检查是否是 [DONE] 标记
              if (dataContent.trim() === "[DONE]") {
                console.log("检测到 [DONE] 标记，流式响应结束");
                parsedContent += "[DONE]";
                processedLines = i + 1;
                break;
              }

              // 如果这行以 {"content": " 开始但没有结束的 }，说明内容跨行了
              if (
                dataContent.startsWith('{"content": "') &&
                !dataContent.endsWith('"}')
              ) {
                console.log("检测到跨行JSON，开始合并多行");
                // 继续读取下一行直到找到结束的 "}
                let j = i + 1;
                while (j < lines.length && !lines[j].endsWith('"}')) {
                  dataContent += "\n" + lines[j];
                  console.log(`合并第 ${j} 行:`, JSON.stringify(lines[j]));
                  j++;
                }
                if (j < lines.length) {
                  dataContent += "\n" + lines[j];
                  console.log(`合并最后一行 ${j}:`, JSON.stringify(lines[j]));
                  i = j; // 跳过已处理的行
                }
                console.log("跨行JSON合并完成:", JSON.stringify(dataContent));
              }

              // 关键修复：正确解析JSON来提取content字段，保持换行符
              try {
                const jsonData = JSON.parse(dataContent);
                if (jsonData.content !== undefined) {
                  // 第一次经验教训：必须提取content字段而不是使用原始JSON
                  parsedContent += jsonData.content;
                  console.log(
                    "✓ 成功解析JSON content:",
                    JSON.stringify(jsonData.content)
                  );
                  if (jsonData.content.includes("\n")) {
                    console.log("✓ 检测到换行符，将正确保持格式");
                  }

                  // Check for tool calls in the content
                  const currentMessageKey =
                    chatContentStore.streamingMessage?.key;
                  console.log(
                    "🔍 Checking for tool calls in streaming content:",
                    {
                      currentMessageKey,
                      contentLength: jsonData.content?.length || 0,
                      contentPreview:
                        jsonData.content?.substring(0, 100) + "...",
                    }
                  );

                  if (currentMessageKey) {
                    // Detect tool call initiation
                    const toolCallData =
                      toolCallsStore.parseToolCallFromContent(jsonData.content);
                    if (toolCallData) {
                      console.log(
                        "🔧 Tool call detected in streaming content:",
                        toolCallData
                      );

                      // Check if tool call already exists to prevent duplicates
                      const existingCalls =
                        toolCallsStore.getToolCallsByMessageKey(
                          currentMessageKey
                        );
                      const alreadyExists = existingCalls.some(
                        (call: any) =>
                          call.toolName === toolCallData.toolName &&
                          call.status === "invoking"
                      );

                      if (!alreadyExists) {
                        const callId = toolCallsStore.createToolCall(
                          currentMessageKey,
                          toolCallData.toolName,
                          toolCallData.arguments
                        );
                        console.log("✅ Created new tool call:", callId);
                      } else {
                        console.log(
                          "⚠️ Tool call already exists, skipping creation"
                        );
                      }
                    }

                    // Detect tool call completion
                    const toolResultData =
                      toolCallsStore.parseToolResultFromContent(
                        jsonData.content
                      );
                    if (toolResultData) {
                      console.log(
                        "✅ Tool result detected in streaming content:",
                        toolResultData
                      );

                      // Use enhanced tool call matching
                      const matchingCall =
                        toolCallsStore.findBestMatchingToolCall(
                          currentMessageKey,
                          toolResultData.toolName,
                          true // Prefer invoking calls
                        );

                      if (matchingCall) {
                        console.log("🔄 Updating tool call status:", {
                          id: matchingCall.id,
                          toolName: matchingCall.toolName,
                          previousStatus: matchingCall.status,
                          newStatus: toolResultData.isError ? "error" : "done",
                          resultLength: toolResultData.result?.length || 0,
                        });

                        toolCallsStore.updateToolCallStatus(
                          matchingCall.id,
                          toolResultData.isError ? "error" : "done",
                          toolResultData.result,
                          toolResultData.isError
                            ? toolResultData.result
                            : undefined
                        );
                      } else {
                        console.warn(
                          "⚠️ No matching tool call found for result - this may indicate a parsing issue or timing problem"
                        );
                        console.log("🔍 Debug info:", {
                          currentMessageKey,
                          toolName: toolResultData.toolName,
                          allToolCalls: Array.from(
                            toolCallsStore.toolCalls.values()
                          ).map((call: any) => ({
                            id: call.id,
                            messageKey: call.messageKey,
                            toolName: call.toolName,
                            status: call.status,
                          })),
                        });
                      }
                    }

                    // Also try to parse the entire content as a tool result (in case it's not wrapped in content field)
                    const directToolResultData =
                      toolCallsStore.parseToolResultFromContent(dataContent);
                    if (directToolResultData && !toolResultData) {
                      console.log(
                        "✅ Tool result detected directly from dataContent:",
                        directToolResultData
                      );

                      const matchingCall =
                        toolCallsStore.findBestMatchingToolCall(
                          currentMessageKey,
                          directToolResultData.toolName,
                          true
                        );

                      if (matchingCall) {
                        console.log("🔄 Updating tool call status (direct):", {
                          id: matchingCall.id,
                          toolName: matchingCall.toolName,
                          newStatus: directToolResultData.isError
                            ? "error"
                            : "done",
                        });

                        toolCallsStore.updateToolCallStatus(
                          matchingCall.id,
                          directToolResultData.isError ? "error" : "done",
                          directToolResultData.result,
                          directToolResultData.isError
                            ? directToolResultData.result
                            : undefined
                        );
                      }
                    }
                  }
                } else if (jsonData.error) {
                  parsedContent += `[ERROR: ${jsonData.error}]`;
                  console.log("检测到错误消息:", jsonData.error);
                }
              } catch (e) {
                console.log("JSON解析失败，尝试备用方案:", e.message);
                console.log("原始数据:", JSON.stringify(dataContent));

                // 备用方案1：使用正则表达式提取content字段（保持换行符）
                const match = dataContent.match(/\{"content":\s*"(.*)"\}/s);
                if (match) {
                  parsedContent += match[1];
                  console.log(
                    "✓ 正则表达式提取成功:",
                    JSON.stringify(match[1])
                  );
                } else {
                  // 备用方案2：检查是否是简单的字符串内容
                  if (
                    dataContent.startsWith('"') &&
                    dataContent.endsWith('"')
                  ) {
                    // 去掉首尾引号
                    const content = dataContent.slice(1, -1);
                    parsedContent += content;
                    console.log("✓ 提取引号内容:", JSON.stringify(content));
                  } else {
                    // 最后的备选方案：直接添加原始数据
                    parsedContent += dataContent;
                    console.log(
                      "⚠ 使用原始数据作为备选方案:",
                      JSON.stringify(dataContent)
                    );
                  }
                }
              }
              processedLines = i + 1;
            } else if (line.trim() === "") {
              // 空行，跳过
              console.log("跳过空行");
              processedLines = i + 1;
            } else {
              // 非SSE格式的行，跳过并继续处理下一行
              console.log("跳过非SSE格式行:", JSON.stringify(line));
              processedLines = i + 1;
            }
            i++;
          }

          // 如果有解析出的内容，更新到store
          console.log("🔍 检查parsedContent:", {
            content: JSON.stringify(parsedContent),
            length: parsedContent.length,
            isEmpty: !parsedContent,
            isDone: parsedContent === "[DONE]",
          });

          if (parsedContent && parsedContent !== "[DONE]") {
            console.log("✅ 更新流式内容:", JSON.stringify(parsedContent));
            if (parsedContent.includes("\n")) {
              console.log("✓ 检测到换行符，内容将正确显示多行");
            }
            chatContentStore.updateStreamingContent(parsedContent);
          } else {
            console.log("❌ 跳过更新 - parsedContent为空或为[DONE]");
          }

          // 从缓冲区中移除已处理的行
          if (processedLines > 0) {
            const remainingLines = lines.slice(processedLines);
            buffer = remainingLines.join("\n");
            console.log(
              `已处理 ${processedLines} 行，剩余缓冲区:`,
              JSON.stringify(buffer)
            );
          }

          console.log("=== SSE解析完成 ===\n");
        }
      } finally {
        reader.releaseLock();
        chatContentStore.finishStreamingResponse();
      }
    }
  } else {
    // Handle regular JSON response (fallback)
    const data = await response.json();
    if (data && data.content) {
      chatContentStore.updateStreamingContent(data.content);
    }
    chatContentStore.finishStreamingResponse();
  }
}

function handleCancel() {
  // Reset the text input
  userInputStore.update_user_input("text", "");
  value.value = "";
  // Clear attachments
  fileAttachmentsStore.clearAllAttachments();
  // Close attachments panel
  open.value = false;
}

// Voice input handler
const handleVoiceTranscript = (transcript: string) => {
  console.log('🎤 Voice transcript received:', transcript);

  // Append to existing text or replace if empty
  const currentText = value.value.trim();
  const newText = currentText ? `${currentText} ${transcript}` : transcript;

  // Update the input value
  value.value = newText;
  userInputStore.update_user_input("text", newText);

  console.log('🎤 Updated input text:', newText);
};

// Clipboard paste handler for images
const handlePaste = async (event: ClipboardEvent) => {
  console.log('📋 Paste event detected');

  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    console.log('📋 No clipboard data available');
    return;
  }

  // Check for image files in clipboard
  const items = Array.from(clipboardData.items);
  const imageItems = items.filter(item => item.type.startsWith('image/'));

  if (imageItems.length === 0) {
    console.log('📋 No image items found in clipboard');
    return;
  }

  console.log(`📋 Found ${imageItems.length} image(s) in clipboard`);

  // Process each image
  for (const item of imageItems) {
    const file = item.getAsFile();
    if (file) {
      console.log('📋 Processing pasted image:', {
        name: file.name || 'pasted-image.png',
        type: file.type,
        size: file.size
      });

      try {
        // Create a proper File object with a name
        const namedFile = new File([file], file.name || `pasted-image-${Date.now()}.png`, {
          type: file.type,
          lastModified: Date.now()
        });

        // Upload the pasted image
        await fileAttachmentsStore.uploadFile(namedFile);
        message.success(`Pasted image uploaded successfully`);

        // Prevent default paste behavior for images
        event.preventDefault();
      } catch (error) {
        console.error('📋 Failed to upload pasted image:', error);
        message.error(`Failed to upload pasted image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};

// Function button states and prompts
const selectedFunctions = ref<Set<string>>(new Set());
const functionPrompts = ref<string[]>([]);

const functionPromptMap = {
  translate: "请帮我翻译以下内容：",
  mindMap: "请为以下内容创建思维导图：",
  email: "请帮我写一封邮件：",
};

const toggleFunction = (functionName: string) => {
  console.log(`Toggle function: ${functionName}`);

  if (selectedFunctions.value.has(functionName)) {
    // Deselect function
    selectedFunctions.value.delete(functionName);
    const promptText =
      functionPromptMap[functionName as keyof typeof functionPromptMap];
    const index = functionPrompts.value.indexOf(promptText);
    if (index > -1) {
      functionPrompts.value.splice(index, 1);
    }
    console.log(`Deselected ${functionName}, removed prompt: "${promptText}"`);
  } else {
    // Select function
    selectedFunctions.value.add(functionName);
    const promptText =
      functionPromptMap[functionName as keyof typeof functionPromptMap];
    if (promptText && !functionPrompts.value.includes(promptText)) {
      functionPrompts.value.push(promptText);
      console.log(`Selected ${functionName}, added prompt: "${promptText}"`);
    }
  }

  console.log("Selected functions:", Array.from(selectedFunctions.value));
  console.log("Function prompts:", functionPrompts.value);
  console.log(
    "Current prompt text to be added to message:",
    functionPrompts.value.join(" ")
  );

  // Update user input with combined prompts
  updateUserInputWithPrompts();
};

const updateUserInputWithPrompts = () => {
  const combinedPrompts = functionPrompts.value.join(" ");
  console.log("Updating user input with prompts:", combinedPrompts);

  // Store the prompts for later use when sending the message
  // The prompts will be prepended to the user's actual message when sending
  if (combinedPrompts.trim()) {
    console.log("Function prompts ready to be used:", combinedPrompts);
  } else {
    console.log("No function prompts selected");
  }
};

const translate = () => toggleFunction("translate");
const mindMap = () => toggleFunction("mindMap");
const email = () => toggleFunction("email");

const rewrite = () => {
  console.log("rewrite");
};

const dataAnalysis = () => {
  console.log("dataAnalysis");
};

// Bubble settings popup function - simplified version
async function showBubbleSettings(): Promise<void> {
  try {
    // For now, just show a simple alert to test the button
    alert(
      "Bubble Settings feature is being implemented. This will open a popup to customize chat bubble appearance."
    );
    message.info("Bubble settings feature coming soon!");
  } catch (error) {
    console.log("Error showing bubble settings:", error);
    message.error("Failed to open bubble settings");
  }
}

// Watch for changes in function prompts
watch(
  functionPrompts,
  (newPrompts, oldPrompts) => {
    console.log("Function prompts changed:");
    console.log("  Old prompts:", oldPrompts);
    console.log("  New prompts:", newPrompts);
    console.log("  Combined prompt text:", newPrompts.join(" "));
  },
  { deep: true }
);

// Watch for changes in selected functions
watch(
  selectedFunctions,
  (newSelected, oldSelected) => {
    console.log("Selected functions changed:");
    console.log("  Old selected:", Array.from(oldSelected || []));
    console.log("  New selected:", Array.from(newSelected));
  },
  { deep: true }
);

watch(loading, () => {
  if (loading.value) {
    const timer = setTimeout(() => {
      loading.value = false;
      value.value = "";

      console.log("Send message successfully!");
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }
});

// Setup paste event listener for image pasting
onMounted(() => {
  console.log('🎯 ChatFrame component mounted successfully!')

  // 添加视觉指示器到DOM
  const chatframeElement = document.getElementById('chatframe')
  if (chatframeElement) {
    chatframeElement.style.border = '2px solid #f59e0b'
    chatframeElement.style.minHeight = '200px'
    console.log('✅ ChatFrame DOM element styled for visibility')
  }

  console.log('📋 Setting up paste event listener for image support');
  document.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
  console.log('📋 Cleaning up paste event listener');
  document.removeEventListener('paste', handlePaste);
});
</script>
<template>
  <div class="chat-frame-container">
    <!-- File Upload Widget - positioned in upper-right corner -->
    <div class="file-upload-widget-container">
      <FileUploadWidget />
    </div>

    <!-- Header Section -->
    <div class="chat-frame-header">
      <Flex wrap="wrap" :gap="12" align="center">
        <Button
          @click="translate"
          type="text"
          size="small"
          :class="[
            'header-action-btn',
            { selected: selectedFunctions.has('translate') },
          ]"
        >
          翻译
        </Button>
        <Button
          @click="mindMap"
          type="text"
          size="small"
          :class="[
            'header-action-btn',
            { selected: selectedFunctions.has('mindMap') },
          ]"
        >
          思维导图
        </Button>
        <Button
          @click="email"
          type="text"
          size="small"
          :class="[
            'header-action-btn',
            { selected: selectedFunctions.has('email') },
          ]"
        >
          邮件
        </Button>
      </Flex>

      <!-- Debug: Show selected function prompts -->
      <div v-if="functionPrompts.length > 0" class="function-prompts-debug">
        <small>Active prompts: {{ functionPrompts.join(" | ") }}</small>
      </div>
    </div>

    <!-- Chat Input Area -->
    <div class="chat-frame-input">
      <Sender
        :value="value"
        :on-change="
          (v) => {
            value = v;
          }
        "
        placeholder="Press Enter to send message"
        :on-submit="handleSendChat"
        :on-cancel="handleCancel"
        :actions="false"
        class="chat-sender-component"
      />
    </div>

    <!-- Footer Section -->
    <div class="chat-frame-footer">
      <Flex justify="space-between" align="center">
        <Flex gap="8" align="center" class="footer-left-section">
          <ModelList
            :model_list="modelListStore.model_list"
            :user_id="userStore.user?.id"
          />
          <Divider type="vertical" class="compact-divider" />
          <span class="deep-thinking-label">Deep Thinking</span>
          <Switch size="small" />
          <Divider type="vertical" class="compact-divider" />
          <Button :icon="h(SearchOutlined)" size="small" class="compact-button">
            Global Search
          </Button>
        </Flex>
        <Flex align="center" gap="6" class="footer-right-section">
          <Button
            :style="iconStyle"
            type="text"
            size="small"
            :icon="h(PaperClipOutlined)"
            @click="open = !open"
            title="Attach files"
            class="icon-button"
          />
          <VoiceInput
            :onTranscript="handleVoiceTranscript"
            language="zh-CN"
            :continuous="false"
            class="voice-input-wrapper"
          />
          <Button
            :icon="h(SettingOutlined)"
            type="text"
            size="small"
            title="Bubble Settings"
            class="icon-button"
            @click="showBubbleSettings"
          />
          <Divider type="vertical" class="compact-divider" />
          <Button
            v-if="loading"
            type="default"
            size="small"
            loading
            class="action-button"
          >
            Sending...
          </Button>
          <Button
            v-else
            type="primary"
            size="small"
            :disabled="isSendDisabled"
            @click="handleSendChat"
            class="action-button send-button"
            :title="
              uploadStatus.hasUploading
                ? 'Please wait for file uploads to complete'
                : 'Send message'
            "
          >
            {{ uploadStatus.hasUploading ? "Uploading..." : "Send" }}
          </Button>
        </Flex>
      </Flex>
    </div>

    <!-- File Attachments Component -->
    <div v-if="open" class="chat-frame-attachments-container">
      <!-- Upload Status Indicator -->
      <div v-if="uploadStatus.total > 0" class="upload-status-bar">
        <Flex justify="space-between" align="center">
          <span class="upload-status-text">
            {{ uploadStatus.done }}/{{ uploadStatus.total }} files uploaded
            <span v-if="uploadStatus.hasUploading" class="uploading-indicator">
              ({{ uploadStatus.uploading }} uploading...)
            </span>
            <span v-if="uploadStatus.hasErrors" class="error-indicator">
              ({{ uploadStatus.error }} failed)
            </span>
          </span>
          <Button
            v-if="uploadStatus.hasErrors"
            type="text"
            size="small"
            @click="fileAttachmentsStore.clearAllAttachments()"
            class="clear-errors-btn"
          >
            Clear All
          </Button>
        </Flex>
      </div>

      <Attachments
        ref="attachmentsRef"
        :items="attachmentItems"
        :placeholder="placeholder"
        :beforeUpload="() => true"
        :customRequest="handleCustomRequest"
        :onRemove="handleFileRemove"
        :onChange="handleFileChange"
        multiple
        class="chat-frame-attachments"
      />
    </div>
  </div>
</template>

<style scoped>
/* Enhanced ChatFrame styling inspired by help.html design */
.chat-frame-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 240px; /* 减少最小高度从260px到240px */
  box-sizing: border-box;
  overflow: visible; /* 改为visible确保下拉菜单可见 */
  border-radius: 16px; /* 匹配容器圆角 */
  position: relative; /* 为文件上传组件提供定位上下文 */
}

/* File Upload Widget positioning */
.file-upload-widget-container {
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 200; /* 确保在其他元素之上 */
}

.chat-frame-header {
  flex-shrink: 0;
  padding: 12px 20px; /* 减少padding从16px到12px */
  border-bottom: 1px solid rgba(229, 231, 235, 0.6); /* 更淡的分割线 */
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); /* 渐变背景 */
  border-radius: 16px 16px 0 0; /* 匹配容器圆角 */
  /* 移除transition和hover效果 */
}

.chat-frame-input {
  flex: 1;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 2px 0; /* 移除左右padding，只保留上下padding */
  background: white; /* 确保背景为白色 */
}

.chat-sender-component {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.chat-frame-footer {
  flex-shrink: 0;
  padding: 10px 20px; /* 进一步减少上下padding从12px到10px */
  border-top: 1px solid rgba(229, 231, 235, 0.6); /* 更淡的分割线 */
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); /* 渐变背景 */
  border-radius: 0 0 16px 16px; /* 匹配容器圆角 */
  transition: background 0.2s ease; /* 平滑过渡 */
}

/* Enhanced button styling in header */
.chat-frame-header :deep(.ant-btn) {
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
  border: 1px solid transparent !important;
  font-size: 13px !important;
}

.chat-frame-header :deep(.ant-btn-text) {
  color: #374151 !important;
  padding: 4px 12px !important;
  height: auto !important;
}

.chat-frame-header :deep(.ant-btn-text:hover) {
  background: rgba(124, 58, 237, 0.1) !important;
  color: #7c3aed !important;
  border-color: rgba(124, 58, 237, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15) !important;
}

.chat-frame-header :deep(.ant-btn-text:active) {
  transform: translateY(0) !important;
  box-shadow: 0 1px 4px rgba(124, 58, 237, 0.2) !important;
}

/* Selected state styling for function buttons */
.chat-frame-header :deep(.ant-btn.selected) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  color: white !important;
  border-color: #7c3aed !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3) !important;
  transform: translateY(-1px) !important;
}

.chat-frame-header :deep(.ant-btn.selected:hover) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  border-color: #6d28d9 !important;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4) !important;
  transform: translateY(-2px) !important;
}

.chat-frame-header :deep(.ant-btn.selected:active) {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3) !important;
}

/* Debug display for function prompts */
.function-prompts-debug {
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 6px;
  font-size: 11px;
  color: #7c3aed;
}

/* Enhanced footer button styling */
.chat-frame-footer :deep(.ant-btn) {
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

.chat-frame-footer :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  border-color: #7c3aed !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3) !important;
}

.chat-frame-footer :deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  border-color: #6d28d9 !important;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4) !important;
  transform: translateY(-1px) !important;
}

.chat-frame-footer :deep(.ant-btn-text) {
  color: #6b7280 !important;
}

.chat-frame-footer :deep(.ant-btn-text:hover) {
  background: rgba(124, 58, 237, 0.1) !important;
  color: #7c3aed !important;
}

/* Enhanced switch styling */
.chat-frame-footer :deep(.ant-switch) {
  background: #d1d5db !important;
}

.chat-frame-footer :deep(.ant-switch-checked) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
}

.chat-frame-attachments-container {
  flex-shrink: 0;
  margin: 2px 0 0 0; /* 移除左右margin，只保留上边距 */
  border-radius: 12px; /* 增加圆角 */
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); /* 渐变背景 */
  border: 1px solid rgba(229, 231, 235, 0.8); /* 半透明边框 */
  max-height: 250px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* 添加阴影 */
}

.upload-status-bar {
  padding: 8px 12px;
  background: rgba(124, 58, 237, 0.05);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  font-size: 12px;
}

.upload-status-text {
  color: #374151;
  font-weight: 500;
}

.uploading-indicator {
  color: #f59e0b;
  font-weight: 600;
}

.error-indicator {
  color: #ef4444;
  font-weight: 600;
}

.clear-errors-btn {
  color: #6b7280 !important;
  font-size: 11px !important;
  padding: 2px 8px !important;
  height: 20px !important;
}

.clear-errors-btn:hover {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
}

.chat-frame-attachments {
  flex: 1;
  overflow-y: auto;
  background: transparent;
}

/* Enhanced Ant Design Sender component styling */
.chat-frame-input :deep(.ant-sender) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important; /* 确保没有内部padding */
  margin: 0 !important; /* 确保没有margin */
}

.chat-frame-input :deep(.ant-sender-wrapper) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important; /* 确保没有内部padding */
  margin: 0 !important; /* 确保没有margin */
}

.chat-frame-input :deep(.ant-sender-input) {
  flex: 1 !important;
  min-height: 0 !important;
  border: 1px solid rgba(209, 213, 219, 0.8) !important; /* 半透明边框 */
  border-radius: 12px !important; /* 增加圆角 */
  margin: 0 !important; /* 完全移除margin */
  background: white !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important; /* 添加阴影 */
}

.chat-frame-input :deep(.ant-sender-input:hover) {
  border-color: rgba(124, 58, 237, 0.3) !important; /* 悬停时紫色边框 */
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1) !important; /* 悬停阴影 */
}

.chat-frame-input :deep(.ant-sender-input:focus-within) {
  border-color: #7c3aed !important; /* 聚焦时紫色边框 */
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1),
    0 2px 8px rgba(124, 58, 237, 0.15) !important; /* 聚焦阴影 */
}

/* Enhanced textarea styling */
.chat-frame-input :deep(.ant-sender-input textarea) {
  border: none !important;
  box-shadow: none !important;
  resize: none !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  color: #374151 !important;
  padding: 12px !important; /* 确保适当的内部padding */
}

.chat-frame-input :deep(.ant-sender-input textarea::placeholder) {
  color: #9ca3af !important;
  font-style: italic !important;
}

/* Enhanced divider styling */
.chat-frame-footer :deep(.ant-divider-vertical) {
  border-color: rgba(209, 213, 219, 0.6) !important;
  margin: 0 8px !important; /* 减少margin从12px到8px */
}

.chat-frame-footer :deep(.compact-divider) {
  margin: 0 6px !important; /* 更紧凑的分割线间距 */
  height: 16px !important; /* 减少分割线高度 */
}

/* Enhanced attachments styling */
.chat-frame-attachments :deep(.ant-upload) {
  background: transparent !important;
}

.chat-frame-attachments :deep(.ant-upload-list) {
  background: transparent !important;
}

.chat-frame-attachments :deep(.ant-upload-list-item) {
  border-radius: 8px !important;
  background: white !important;
  border: 1px solid rgba(229, 231, 235, 0.8) !important;
  margin-bottom: 8px !important;
  transition: all 0.2s ease !important;
}

.chat-frame-attachments :deep(.ant-upload-list-item:hover) {
  border-color: rgba(124, 58, 237, 0.3) !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1) !important;
}

/* Enhanced scrollbar for attachments */
.chat-frame-attachments::-webkit-scrollbar {
  width: 6px;
}

.chat-frame-attachments::-webkit-scrollbar-track {
  background: rgba(243, 244, 246, 0.5);
  border-radius: 3px;
}

.chat-frame-attachments::-webkit-scrollbar-thumb {
  background: rgba(209, 213, 219, 0.8);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.chat-frame-attachments::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.9);
}

/* Hide the default header and footer from Sender since we're using our own */
.chat-frame-input :deep(.ant-sender-header),
.chat-frame-input :deep(.ant-sender-footer) {
  display: none !important;
}

/* Footer section styling */
.footer-left-section {
  flex: 1;
  min-width: 0; /* 允许flex项目收缩 */
}

.footer-right-section {
  flex-shrink: 0; /* 防止右侧按钮区域收缩 */
}

/* Deep Thinking label styling */
.deep-thinking-label {
  font-size: 13px !important;
  color: #374151 !important;
  font-weight: 500 !important;
  white-space: nowrap;
}

/* Compact button styling */
.chat-frame-footer :deep(.compact-button) {
  padding: 4px 12px !important;
  height: 28px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
}

/* Icon button styling */
.chat-frame-footer :deep(.icon-button) {
  padding: 4px 6px !important;
  height: 28px !important;
  width: 28px !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Voice input wrapper styling */
.chat-frame-footer .voice-input-wrapper {
  display: inline-flex;
  align-items: center;
}

.chat-frame-footer .voice-input-wrapper :deep(.voice-input-button) {
  padding: 4px 6px !important;
  height: 28px !important;
  width: 28px !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Action button styling */
.chat-frame-footer :deep(.action-button) {
  padding: 4px 16px !important;
  height: 32px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  min-width: 80px !important;
}

/* Send button special styling */
.chat-frame-footer :deep(.send-button) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  border-color: #7c3aed !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3) !important;
  font-weight: 700 !important;
}

.chat-frame-footer :deep(.send-button:hover) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  border-color: #6d28d9 !important;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4) !important;
  transform: translateY(-1px) !important;
}
</style>
