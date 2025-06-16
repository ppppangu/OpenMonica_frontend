<script setup lang="ts">
import {
  CopyOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import { BubbleList } from "ant-design-x-vue";
import { Button, Flex, Space, Spin } from "ant-design-vue";

import { Typography } from "ant-design-vue";
import { Prompts } from "ant-design-x-vue";
import { Attachments } from "ant-design-x-vue";
import markdownit from "markdown-it";
import { ref, h, onMounted, computed, watch } from "vue";
import { useChatHistoryContentStore } from "../store/chat_history_content";
import { useChatHistoryStore } from "../store/chat_history";
import { useUserStore } from "../store/user_info";
import { useToolCallsStore } from "../store/tool_calls";
import ToolCallInterface from "../components/ToolCallInterface.vue";

defineOptions({ name: "ChatBox" });

const md = markdownit({ html: true, breaks: true, linkify: true });

const listRef = ref<any>(null);
const aiheader = ref("Ant Design X");
const userheader = ref("User");
const chatContentsStore = useChatHistoryContentStore();
const chatHistoryStore = useChatHistoryStore();
const activeChatHistoryItem = computed(
  () => chatHistoryStore.activeChatHistoryItem
);
const userStore = useUserStore();
const toolCallsStore = useToolCallsStore();

// Cache to track processed messages and prevent infinite loops
const processedMessagesCache = ref<Set<string>>(new Set());

// Debounce map to prevent rapid re-processing
const debounceMap = ref<Map<string, number>>(new Map());

// Non-reactive tool call detection function with debouncing
const detectAndProcessToolCalls = (content: string, messageKey: string) => {
  // Prevent re-processing the same message
  if (processedMessagesCache.value.has(messageKey)) {
    return;
  }

  // Debounce rapid calls for the same message
  const now = Date.now();
  const lastProcessed = debounceMap.value.get(messageKey);
  if (lastProcessed && (now - lastProcessed) < 100) { // 100ms debounce
    return;
  }
  debounceMap.value.set(messageKey, now);

  try {
    console.log('🔍 Processing tool calls for message:', {
      messageKey,
      contentLength: content.length,
      contentPreview: content.substring(0, 200) + '...'
    });

    // Detect and process tool calls
    const toolCallData = toolCallsStore.parseToolCallFromContent(content);
    if (toolCallData) {
      console.log('🔧 Tool call detected:', {
        messageKey,
        toolName: toolCallData.toolName,
        arguments: toolCallData.arguments
      });

      // Check if tool call already exists to prevent duplicates
      const existingCalls = toolCallsStore.getToolCallsByMessageKey(messageKey);
      const alreadyExists = existingCalls.some((call: any) =>
        call.toolName === toolCallData.toolName &&
        call.status === 'invoking'
      );

      if (!alreadyExists) {
        // Create tool call in store
        const callId = toolCallsStore.createToolCall(messageKey, toolCallData.toolName, toolCallData.arguments);
        console.log('✅ Tool call created:', {
          callId,
          messageKey,
          toolName: toolCallData.toolName
        });
      } else {
        console.log('⚠️ Tool call already exists, skipping creation:', {
          messageKey,
          toolName: toolCallData.toolName
        });
      }
    }

    // Check for tool results
    const toolResultData = toolCallsStore.parseToolResultFromContent(content);
    if (toolResultData) {
      console.log('🔍 Tool result detected:', {
        messageKey,
        toolName: toolResultData.toolName,
        isError: toolResultData.isError,
        resultLength: toolResultData.result?.length || 0
      });

      // Find existing tool call and update it
      const existingCalls = toolCallsStore.getToolCallsByMessageKey(messageKey);
      console.log('🔍 Existing tool calls for message:', {
        messageKey,
        existingCallsCount: existingCalls.length,
        existingCalls: existingCalls.map((call: any) => ({
          id: call.id,
          toolName: call.toolName,
          status: call.status
        }))
      });

      // Use enhanced matching to find the best tool call
      const matchingCall = toolCallsStore.findBestMatchingToolCall(messageKey, toolResultData.toolName, true);
      if (matchingCall) {
        console.log('✅ Found matching tool call, updating status:', {
          callId: matchingCall.id,
          toolName: matchingCall.toolName,
          previousStatus: matchingCall.status,
          newStatus: toolResultData.isError ? 'error' : 'done'
        });

        toolCallsStore.updateToolCallStatus(
          matchingCall.id,
          toolResultData.isError ? 'error' : 'done',
          toolResultData.result,
          toolResultData.isError ? toolResultData.result : undefined
        );
      } else {
        console.warn('❌ No matching tool call found for result:', {
          messageKey,
          toolName: toolResultData.toolName,
          availableToolNames: existingCalls.map((call: any) => call.toolName)
        });

        // Create a new tool call if none exists (fallback for missed tool calls)
        console.log('🔄 Creating fallback tool call for orphaned result');
        const fallbackCallId = toolCallsStore.createToolCall(messageKey, toolResultData.toolName, {});
        toolCallsStore.updateToolCallStatus(
          fallbackCallId,
          toolResultData.isError ? 'error' : 'done',
          toolResultData.result,
          toolResultData.isError ? toolResultData.result : undefined
        );
      }
    }

    // Mark as processed
    processedMessagesCache.value.add(messageKey);
  } catch (error) {
    console.error('Error in detectAndProcessToolCalls:', error);
    // Still mark as processed to prevent infinite retries
    processedMessagesCache.value.add(messageKey);
  }
};

// JSON 转义处理函数
const unescapeJsonContent = (content: string): string => {
  if (!content) return content;

  try {
    // 处理常见的 JSON 转义字符
    return content
      .replace(/\\n/g, '\n')      // 换行符
      .replace(/\\r/g, '\r')      // 回车符
      .replace(/\\t/g, '\t')      // 制表符
      .replace(/\\"/g, '"')       // 双引号
      .replace(/\\\\/g, '\\')     // 反斜杠
      .replace(/\\u([0-9a-fA-F]{4})/g, (_match, code) => {
        // Unicode 转义
        return String.fromCharCode(parseInt(code, 16));
      });
  } catch (error) {
    console.warn('JSON unescape error:', error);
    return content;
  }
};

// Pure markdown renderer without side effects
const renderMarkdownWithToolCalls = (content: string, messageKey: string) => {
  // 确保content不为空
  if (!content) {
    console.warn('renderMarkdown: 收到空内容');
    return h("div", { style: { color: '#999', fontSize: '12px' } }, '(空消息)');
  }

  console.log('renderMarkdown: 渲染内容长度=', content.length, '包含换行符=', content.includes('\n'));

  // Get tool calls for this message (read-only)
  const toolCalls = toolCallsStore.getToolCallsByMessageKey(messageKey);

  // 处理 JSON 转义字符，然后进行 markdown 渲染
  const unescapedContent = unescapeJsonContent(content);
  const renderedHTML = md.render(unescapedContent);

  console.log('renderMarkdown: JSON转义处理', {
    原始长度: content.length,
    处理后长度: unescapedContent.length,
    包含换行符: unescapedContent.includes('\n'),
    转义前预览: content.substring(0, 100),
    转义后预览: unescapedContent.substring(0, 100)
  });

  return h("div", {}, [
    // Tool calls interface (if any)
    toolCalls.length > 0 ? h(ToolCallInterface, { messageKey }) : null,
    // Regular markdown content
    h(Typography, null, {
      default: () =>
        h("div", {
          innerHTML: renderedHTML,
          style: {
            // 为markdown渲染的图片添加样式
            "--img-max-width": "100%",
            "--img-max-height": "300px",
            "--img-border-radius": "8px",
            "--img-margin": "8px 0",
          },
        }),
    })
  ]);
};

// Legacy markdown renderer for backward compatibility
const renderMarkdown = (content: string) => {
  if (!content) {
    console.warn('renderMarkdown: 收到空内容');
    return h("div", { style: { color: '#999', fontSize: '12px' } }, '(空消息)');
  }

  // 处理 JSON 转义字符，然后进行 markdown 渲染
  const unescapedContent = unescapeJsonContent(content);
  const renderedHTML = md.render(unescapedContent);

  return h(Typography, null, {
    default: () =>
      h("div", {
        innerHTML: renderedHTML,
        style: {
          "--img-max-width": "100%",
          "--img-max-height": "300px",
          "--img-border-radius": "8px",
          "--img-margin": "8px 0",
        },
      }),
  });
};

// 标记是否正在加载历史消息
const isLoadingHistory = ref(false);

// Old tool execution rendering functions removed - now using ToolCallInterface component

// 使用更简单的类型定义避免深度类型推断
const roles = {
  // 历史消息的助手角色（无typing效果）
  assistant_history: {
    variant: "filled" as const,
    messageRender: renderMarkdown, // Will be overridden per message
    placement: "start" as const,
    loading: false,
    header: aiheader.value,
    avatar: { icon: h(UserOutlined), style: { background: "#fde3cf" } },
    // 历史消息不使用typing效果
    style: {
      maxWidth: 600,
      marginInlineEnd: 44,
    },
    styles: {
      footer: {
        width: "100%",
      },
    },
    footer: h(Flex, {}, [
      h(Button, {
        size: "small",
        type: "text",
        icon: h(SyncOutlined),
        style: { marginInlineEnd: "8px" },
      }),
      h(Button, {
        size: "small",
        type: "text",
        icon: h(CopyOutlined),
        style: { marginInlineEnd: "auto" },
      }),
    ]),
    loadingRender: () =>
      h(Space, {}, [h(Spin, { size: "small" }), "模型正在思考中..."]),
  },
  // 新消息的助手角色（禁用typing效果避免文字旋转）
  assistant: {
    variant: "filled" as const,
    messageRender: renderMarkdown, // Will be overridden per message
    placement: "start" as const,
    loading: false,
    header: aiheader.value,
    avatar: { icon: h(UserOutlined), style: { background: "#fde3cf" } },
    // typing: { step: 5, interval: 20 }, // 禁用typing效果
    style: {
      maxWidth: 600,
      marginInlineEnd: 44,
    },
    styles: {
      footer: {
        width: "100%",
      },
    },
    footer: h(Flex, {}, [
      h(Button, {
        size: "small",
        type: "text",
        // typing: { step: 2, interval: 50, suffix: "💗" }, // 禁用按钮typing效果
        icon: h(SyncOutlined),
        style: { marginInlineEnd: "8px" },
      }),
      h(Button, {
        size: "small",
        type: "text",
        icon: h(CopyOutlined),
        style: { marginInlineEnd: "auto" },
      }),
    ]),
    loadingRender: () =>
      h(Space, {}, [h(Spin, { size: "small" }), "模型正在思考中..."]),
  },
  user: {
    variant: "filled" as const,
    messageRender: renderMarkdown,
    placement: "end" as const,
    avatar: { icon: h(UserOutlined), style: { background: "#87d068" } },
    header: userStore.user?.username,
    footer: h(Flex, {}, [
      h(Button, {
        size: "small",
        type: "text",
        icon: h(CopyOutlined),
        style: { marginInlineEnd: "auto" },
      }),
    ]),
  },
  suggestion: {
    placement: "start" as const,
    avatar: { icon: h(UserOutlined), style: { visibility: "hidden" as const } },
    variant: "borderless" as const,
    messageRender: (items: any) =>
      h(Prompts, { vertical: true, items: items as any }),
  },
  file: {
    placement: "start" as const,
    avatar: { icon: h(UserOutlined), style: { visibility: "hidden" as const } },
    variant: "borderless" as const,
    messageRender: (items: any) =>
      h(
        Flex,
        { vertical: true, gap: "middle" },
        items.map((item: any) =>
          h(Attachments.FileCard, { key: item.uid, item: item })
        )
      ),
  },
} as any;

// Prevent infinite computation loops
let isComputingMessages = false;

// 计算属性：合并历史消息和当前实时消息，使用新的工具调用接口
const allMessages = computed(() => {
  // Prevent recursive computation
  if (isComputingMessages) {
    console.warn('Preventing recursive allMessages computation');
    return [];
  }

  isComputingMessages = true;
  const processedMessages: any[] = [];

  try {
    // 处理历史消息
    chatContentsStore.chatHistoryContent.forEach((item: any, index: number) => {
      const originalRole = item.messages[0].role;
      const role = originalRole === "assistant" ? "assistant_history" : originalRole;
      const content = filterDone(item.messages[0].content[0].text);
      const messageKey = `history_${item.timestamp || index}`;

      // Process tool calls separately (non-reactive) - use setTimeout to break reactive chain
      if (role === "assistant_history") {
        setTimeout(() => detectAndProcessToolCalls(content, messageKey), 0);
      }

      // Create message with enhanced renderer for assistant messages
      const messageToAdd: any = {
        key: messageKey,
        role: role,
        content: content,
      };

      // Override messageRender for assistant messages to include tool call detection
      if (role === "assistant_history") {
        messageToAdd.messageRender = (content: string) => renderMarkdownWithToolCalls(content, messageKey);
      }

      processedMessages.push(messageToAdd);
    });

    // 处理当前消息
    chatContentsStore.currentChatMessages.forEach((item: any, index: number) => {
      // 对于流式响应，使用assistant角色；对于历史消息，使用assistant_history
      const role = item.role === 'assistant' && !item.streaming ? 'assistant_history' : item.role;
      const messageKey = item.key || `current_${index}`;

      console.log(`处理当前消息: key=${messageKey}, role=${role}, originalRole=${item.role}, streaming=${item.streaming}, content长度=${item.content?.length || 0}`);

      // Process tool calls immediately for assistant messages
      if (role === "assistant" || role === "assistant_history") {
        detectAndProcessToolCalls(item.content, messageKey);
      }

      // Create message with enhanced renderer for assistant messages
      const messageToAdd: any = {
        key: messageKey,
        role: role,
        content: item.content,
      };

      // Override messageRender for assistant messages to include tool call detection
      if (role === "assistant" || role === "assistant_history") {
        messageToAdd.messageRender = (content: string) => renderMarkdownWithToolCalls(content, messageKey);
      }

      console.log(`添加消息到渲染列表: key=${messageKey}, role=${role}, content预览="${item.content?.substring(0, 50)}..."`);
      processedMessages.push(messageToAdd);
    });

  } catch (error) {
    console.error('Error processing messages:', error);
  } finally {
    isComputingMessages = false;
  }

  console.log(`allMessages 计算完成: 总消息数=${processedMessages.length}`);
  processedMessages.forEach((msg, index) => {
    console.log(`  消息${index}: key=${msg.key}, role=${msg.role}, content长度=${msg.content?.length || 0}`);
  });

  return processedMessages;
});

watch(activeChatHistoryItem, async (newValue, oldValue) => {
  // Prevent unnecessary re-processing if the session_id hasn't actually changed
  if (newValue?.session_id === oldValue?.session_id) {
    return;
  }

  if (newValue?.session_id) {
    console.log(
      "ChatBox: activeChatHistoryItem changed to:",
      newValue.session_id
    );

    // 标记正在加载历史消息
    isLoadingHistory.value = true;

    // 清空当前聊天消息和工具调用状态
    chatContentsStore.clearCurrentChat();
    toolCallsStore.clearAllToolCalls();

    // Clear processed messages cache and debounce map
    processedMessagesCache.value.clear();
    debounceMap.value.clear();

    await chatContentsStore.getChatHistoryContent(newValue.session_id);
    console.log(
      "ChatBox: chat content fetched:",
      chatContentsStore.chatHistoryContent
    );

    // 标记历史消息加载完成
    isLoadingHistory.value = false;
  }
});

// Optimized watcher for current chat messages - only log changes, don't trigger side effects
watch(
  () => chatContentsStore.currentChatMessages.length,
  (newLength, oldLength) => {
    if (newLength !== oldLength) {
      console.log(`ChatBox: currentChatMessages count changed from ${oldLength} to ${newLength}`);
    }
  }
);

// Optimized watcher for tool calls - only log changes
watch(
  () => toolCallsStore.toolCalls.size,
  (newSize, oldSize) => {
    if (newSize !== oldSize) {
      console.log(`ChatBox: toolCalls count changed from ${oldSize} to ${newSize}`);
    }
  }
);

// 过滤掉content结尾的[DONE],只过滤结尾的，可能有一行[DONE]，也可能有两行[DONE]
function filterDone(content: string) {
  const lines = content.split("\n");
  const lastLine = lines[lines.length - 1];
  const secondLastLine = lines[lines.length - 2];
  if (lastLine.includes("[DONE]")) {
    if (secondLastLine.includes("[DONE]")) {
      return lines.slice(0, -2).join("\n");
    }
    return lines.slice(0, -1).join("\n");
  }
  return content;
}

// Clear all caches and states
const clearAllStates = () => {
  toolCallsStore.clearAllToolCalls();
  processedMessagesCache.value.clear();
  debounceMap.value.clear();
  console.log('All states and caches cleared');
};

// Test function for debugging tool call parsing
const testToolCallParsing = () => {
  console.log('🧪 Testing tool call parsing...');

  // Test tool call creation
  const toolCallContent = '{"tool": "create_wordcloud_chart", "arguments": {"text": "猫咪 狗勾 兔子 仓鼠 宠物 可爱 毛茸茸"}}';
  const toolCallResult = toolCallsStore.parseToolCallFromContent(toolCallContent);
  console.log('Tool call parsing result:', toolCallResult);

  if (toolCallResult) {
    const testMessageKey = 'test_message_123';
    const callId = toolCallsStore.createToolCall(testMessageKey, toolCallResult.toolName, toolCallResult.arguments);
    console.log('Created test tool call:', callId);

    // Test tool result parsing
    const toolResultContent = JSON.stringify({
      "params": {"tool": "create_wordcloud_chart", "arguments": {"text": "猫咪 狗勾 兔子 仓鼠 宠物 可爱 毛茸茸"}},
      "tool_response": "Tool execution result:【create_wordcloud_chart】 http://1.tcp.cpolar.cn:21729/publicfiles/subserver/charts/wordcloud_642510ee-eecb-4d64-9895-1c397d2eb295_artifacts.html",
      "is_error": false
    });

    console.log('Testing tool result content:', toolResultContent);
    const toolResultData = toolCallsStore.parseToolResultFromContent(toolResultContent);
    console.log('Tool result parsing result:', toolResultData);

    if (toolResultData) {
      // Test status update
      toolCallsStore.updateToolCallStatus(callId, 'done', toolResultData.result);
      console.log('Updated tool call status to done');

      // Check final state
      const finalCall = toolCallsStore.getToolCallById(callId);
      console.log('Final tool call state:', finalCall);
    }
  }
};

// Comprehensive debugging function for tool call issues
const debugToolCallIssues = () => {
  console.log('🔍 === TOOL CALL DEBUG REPORT ===');

  // 1. Check current tool calls state
  const allToolCalls = Array.from(toolCallsStore.toolCalls.values());
  console.log('📊 Current tool calls count:', allToolCalls.length);

  allToolCalls.forEach((call: any, index: number) => {
    console.log(`🔧 Tool Call ${index + 1}:`, {
      id: call.id,
      toolName: call.toolName,
      status: call.status,
      messageKey: call.messageKey,
      hasResult: !!call.result,
      resultLength: call.result?.length || 0,
      timestamp: call.timestamp
    });
  });

  // 2. Check current chat messages
  const currentMessages = chatContentsStore.currentChatMessages;
  console.log('💬 Current chat messages count:', currentMessages.length);

  currentMessages.forEach((msg: any, index: number) => {
    console.log(`📝 Message ${index + 1}:`, {
      key: msg.key,
      role: msg.role,
      contentLength: msg.content?.length || 0,
      streaming: msg.streaming,
      contentPreview: msg.content?.substring(0, 100) + '...'
    });

    // Test parsing on each message
    if (msg.role === 'assistant' && msg.content) {
      const toolCallData = toolCallsStore.parseToolCallFromContent(msg.content);
      const toolResultData = toolCallsStore.parseToolResultFromContent(msg.content);

      if (toolCallData) {
        console.log(`  🔧 Contains tool call:`, toolCallData);
      }
      if (toolResultData) {
        console.log(`  ✅ Contains tool result:`, toolResultData);
      }
    }
  });

  // 3. Check for stuck tool calls
  const stuckCalls = allToolCalls.filter((call: any) => call.status === 'invoking');
  if (stuckCalls.length > 0) {
    console.warn('⚠️ Found stuck tool calls (still invoking):');
    stuckCalls.forEach((call: any) => {
      console.warn('  🔄 Stuck call:', {
        id: call.id,
        toolName: call.toolName,
        messageKey: call.messageKey,
        age: Date.now() - new Date(call.timestamp).getTime() + 'ms'
      });
    });
  }

  console.log('🔍 === END DEBUG REPORT ===');
};

// Add a function to manually trigger tool call detection for debugging
const manualToolCallDetection = (messageKey?: string) => {
  console.log('🔧 Manual tool call detection triggered');

  if (messageKey) {
    // Process specific message
    const message = chatContentsStore.currentChatMessages.find((msg: any) => msg.key === messageKey);
    if (message) {
      console.log('🔍 Processing specific message:', messageKey);
      detectAndProcessToolCalls(message.content, messageKey);
    } else {
      console.warn('❌ Message not found:', messageKey);
    }
  } else {
    // Process all current messages
    console.log('🔍 Processing all current messages');
    chatContentsStore.currentChatMessages.forEach((message: any, index: number) => {
      if (message.role === 'assistant') {
        console.log(`🔍 Processing message ${index + 1}:`, message.key);
        detectAndProcessToolCalls(message.content, message.key);
      }
    });
  }
};

// Simplified popup management functions
function showBubbleSettings(): void {
  console.log('Bubble settings requested');
  alert('Bubble Settings: This feature allows you to customize chat bubble appearance including themes, animations, and layout options.');
}

// Debugging functions for tool calls (development only)
if (import.meta.env.DEV) {
  (window as any).clearToolCalls = () => toolCallsStore.clearAllToolCalls();
  (window as any).clearAllStates = clearAllStates;
  (window as any).toolCallsStore = toolCallsStore;
  (window as any).processedMessagesCache = processedMessagesCache;
  (window as any).testToolCallParsing = testToolCallParsing;
  (window as any).debugToolCallIssues = debugToolCallIssues;
  (window as any).chatContentsStore = chatContentsStore;
  (window as any).showBubbleSettings = showBubbleSettings;
  (window as any).manualToolCallDetection = manualToolCallDetection;
}

onMounted(async () => {
  try {
    // Clear all states first to prevent any leftover reactive loops
    clearAllStates();

    await chatContentsStore.getChatHistoryContent(
      activeChatHistoryItem.value?.session_id || ""
    );

    console.log('ChatBox mounted, all states cleared');
    console.log('🔧 Debug functions available:');
    console.log('  - window.debugToolCalls() - Show debug report');
    console.log('  - window.testToolCallParsing() - Test parsing functions');
    console.log('  - window.manualToolCallDetection(messageKey?) - Manually trigger detection');
  } catch (error) {
    console.error('Error in ChatBox onMounted:', error);
  }
});
</script>
<template>
  <BubbleList
    ref="listRef"
    :style="{ height: '100%', maxHeight: '100%', overflow: 'hidden' }"
    :roles="roles"
    :items="allMessages"
  />
</template>

<style scoped>
/* 为markdown渲染的图片添加样式 */
:deep(img) {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
  display: block;
  margin: 8px 0;
}

/* 工具执行横幅样式 */
:deep(.tool-execution-banner) {
  transition: all 0.3s ease;
}

:deep(.tool-execution-banner.loading) {
  background: linear-gradient(90deg, #f3e8ff 0%, #ede9fe 50%, #f3e8ff 100%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

/* 只有在loading状态下才显示动画 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 移除pulse动画，避免不必要的动画效果 */

/* 工具完成卡片样式 */
:deep(.tool-completion-card) {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.tool-completion-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

:deep(.tool-card-header) {
  transition: background 0.2s ease;
}

:deep(.tool-card-header:hover) {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%) !important;
}

:deep(.tool-card-content) {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    padding: 0 16px;
  }
  to {
    opacity: 1;
    max-height: 200px;
    padding: 16px;
  }
}

/* 工具执行气泡特殊样式 */
:deep(.ant-bubble[data-role="tool_execution"]) {
  margin: 4px 0;
}

:deep(.ant-bubble[data-role="tool_execution"] .ant-bubble-content) {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

/* 禁用所有可能的旋转和typing动画 */
:deep(.ant-bubble-content) {
  animation: none !important;
}

:deep(.ant-bubble-typing) {
  animation: none !important;
}

:deep(.ant-bubble) {
  animation: none !important;
}

/* 确保文字不会旋转 - 暂时注释掉过于激进的规则 */
/* :deep(*) {
  animation: none !important;
  transform: none !important;
} */
</style>
