<script setup lang="ts">
import {
  CoffeeOutlined,
  FireOutlined,
  SmileOutlined,
  FrownOutlined,
  CopyOutlined,
  SyncOutlined,
  UserOutlined,
  ToolOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons-vue";
import { BubbleList } from "ant-design-x-vue";
import { Button, Flex, Space, Spin, Card, Collapse } from "ant-design-vue";

import { Typography } from "ant-design-vue";
import { Prompts } from "ant-design-x-vue";
import { Attachments } from "ant-design-x-vue";
import markdownit from "markdown-it";
import { ref, h, onMounted, computed, watch } from "vue";
import { useChatHistoryContentStore } from "../store/chat_history_content";
import { useChatHistoryStore } from "../store/chat_history";
import { useUserStore } from "../store/user_info";

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

// 解析markdown（简化版本，移除工具执行检测）
const renderMarkdown = (content: string) => {
  // 确保content不为空
  if (!content) {
    console.warn('renderMarkdown: 收到空内容');
    return h("div", { style: { color: '#999', fontSize: '12px' } }, '(空消息)');
  }

  console.log('renderMarkdown: 渲染内容长度=', content.length, '包含换行符=', content.includes('\n'));

  // 正常的markdown渲染
  const renderedHTML = md.render(content);

  return h(Typography, null, {
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
  });
};

// 标记是否正在加载历史消息
const isLoadingHistory = ref(false);

// Tool execution detection and state management
const toolExecutionStates = ref<Map<string, {
  isExecuting: boolean;
  toolName: string;
  arguments: any;
  result?: string;
  isError?: boolean;
  isExpanded?: boolean;
}>>(new Map());

// Tool execution detection patterns
const TOOL_EXECUTION_PATTERN = /```json\s*\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{.*?\})\s*\}\s*```/s;
const TOOL_COMPLETION_PATTERN = /"params"\s*:\s*\{[^}]*"tool"\s*:\s*"([^"]+)"[^}]*\}\s*,\s*"tool_response"\s*:\s*"([^"]+)"\s*,\s*"is_error"\s*:\s*(true|false)/s;

// Detect tool execution in content
const detectToolExecution = (content: string, messageKey: string) => {
  if (!content || !messageKey || content.length < 10) {
    return false;
  }

  // 避免重复检测同一个消息
  if (toolExecutionStates.value.has(messageKey)) {
    return true; // 已经检测过了
  }

  try {
    // Check for tool execution start pattern
    const executionMatch = content.match(TOOL_EXECUTION_PATTERN);
    if (executionMatch) {
      const toolName = executionMatch[1];
      const argumentsStr = executionMatch[2];

      console.log('Tool execution detected:', { toolName, messageKey });

      try {
        const parsedArgs = JSON.parse(argumentsStr);
        toolExecutionStates.value.set(messageKey, {
          isExecuting: true,
          toolName,
          arguments: parsedArgs,
          isExpanded: false
        });
        return true;
      } catch (parseError) {
        console.error('Failed to parse tool arguments:', parseError);
        return false; // 如果参数解析失败，不创建状态
      }
    }

    // Check for tool completion pattern
    const completionMatch = content.match(TOOL_COMPLETION_PATTERN);
    if (completionMatch) {
      const toolName = completionMatch[1];
      const toolResponse = completionMatch[2];
      const isError = completionMatch[3] === 'true';

      console.log('Tool completion detected:', { toolName, messageKey, isError });

      const existingState = toolExecutionStates.value.get(messageKey) || { arguments: {} };
      toolExecutionStates.value.set(messageKey, {
        isExecuting: false,
        toolName,
        arguments: existingState.arguments || {},
        result: toolResponse,
        isError,
        isExpanded: false
      });

      return true;
    }

    // Alternative pattern for tool completion (more flexible JSON parsing)
    try {
      const jsonMatch = content.match(/\{[\s\S]*"params"[\s\S]*"tool_response"[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        if (parsed.params && parsed.params.tool && parsed.tool_response !== undefined) {
          const toolName = parsed.params.tool;
          const toolResponse = parsed.tool_response;
          const isError = parsed.is_error === true;

          console.log('Tool completion detected (JSON):', { toolName, messageKey, isError });

          const existingState = toolExecutionStates.value.get(messageKey) || { arguments: {} };
          toolExecutionStates.value.set(messageKey, {
            isExecuting: false,
            toolName,
            arguments: existingState.arguments || {},
            result: toolResponse,
            isError,
            isExpanded: false
          });

          return true;
        }
      }
    } catch (jsonError) {
      // Ignore JSON parsing errors for alternative pattern
    }

  } catch (error) {
    console.error('Error in tool execution detection:', error);
  }

  return false;
};

// Render tool execution loading banner
const renderToolLoadingBanner = (toolName: string, args: any) => {
  return h('div', {
    class: 'tool-execution-banner loading',
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
      border: '1px solid #c4b5fd',
      borderRadius: '8px',
      margin: '8px 0',
      gap: '8px'
    }
  }, [
    h(LoadingOutlined, {
      style: { color: '#7c3aed', fontSize: '16px' }
    }),
    h('span', {
      style: { color: '#7c3aed', fontWeight: '500', fontSize: '14px' }
    }, `正在执行工具: ${toolName}`),
    h('div', {
      style: {
        marginLeft: 'auto',
        fontSize: '12px',
        color: '#8b5cf6',
        background: 'rgba(124, 58, 237, 0.1)',
        padding: '2px 8px',
        borderRadius: '4px'
      }
    }, '执行中...')
  ]);
};

// Render tool completion card
const renderToolCompletionCard = (toolName: string, result: string, isError: boolean, isExpanded: boolean, messageKey: string) => {
  const toggleExpanded = () => {
    try {
      const state = toolExecutionStates.value.get(messageKey);
      if (state) {
        toolExecutionStates.value.set(messageKey, {
          ...state,
          isExpanded: !state.isExpanded
        });
      }
    } catch (error) {
      console.error('Error toggling tool card expansion:', error);
    }
  };

  return h('div', {
    class: 'tool-completion-card',
    style: {
      border: `1px solid ${isError ? '#fecaca' : '#c4b5fd'}`,
      borderRadius: '8px',
      margin: '8px 0',
      overflow: 'hidden',
      background: isError ? '#fef2f2' : '#f9fafb'
    }
  }, [
    // Header
    h('div', {
      class: 'tool-card-header',
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        background: isError ? '#fee2e2' : 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
        borderBottom: `1px solid ${isError ? '#fecaca' : '#e5e7eb'}`,
        cursor: 'pointer'
      },
      onClick: toggleExpanded
    }, [
      h(isError ? ExclamationCircleOutlined : CheckCircleOutlined, {
        style: {
          color: isError ? '#dc2626' : '#16a34a',
          fontSize: '16px',
          marginRight: '8px'
        }
      }),
      h('span', {
        style: {
          fontWeight: '500',
          fontSize: '14px',
          color: isError ? '#dc2626' : '#374151'
        }
      }, `工具执行${isError ? '失败' : '完成'}: ${toolName}`),
      h('div', {
        style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }
      }, [
        h('span', {
          style: {
            fontSize: '12px',
            color: isError ? '#dc2626' : '#16a34a',
            background: isError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px'
          }
        }, isError ? '错误' : '成功'),
        h(isExpanded ? UpOutlined : DownOutlined, {
          style: { fontSize: '12px', color: '#6b7280' }
        })
      ])
    ]),
    // Content (expandable)
    isExpanded ? h('div', {
      class: 'tool-card-content',
      style: {
        padding: '16px',
        background: 'white',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#374151',
        maxHeight: '200px',
        overflow: 'auto'
      }
    }, [
      h('div', {
        style: { marginBottom: '8px', fontWeight: '500' }
      }, '执行结果:'),
      h('div', {
        style: {
          background: '#f9fafb',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          fontFamily: 'monospace',
          fontSize: '12px',
          wordBreak: 'break-all'
        }
      }, result)
    ]) : null
  ]);
};

// 使用更简单的类型定义避免深度类型推断
const roles = {
  // 历史消息的助手角色（无typing效果）
  assistant_history: {
    variant: "filled" as const,
    messageRender: renderMarkdown,
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
    messageRender: renderMarkdown,
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
  // 工具执行角色 - 专门用于显示工具执行状态
  tool_execution: {
    placement: "start" as const,
    avatar: { icon: h(ToolOutlined), style: { background: "#f3e8ff" } },
    variant: "borderless" as const,
    messageRender: (content: string) => {
      try {
        // content should be the tool state key
        const toolState = toolExecutionStates.value.get(content);
        if (toolState) {
          if (toolState.isExecuting) {
            return renderToolLoadingBanner(toolState.toolName, toolState.arguments);
          } else if (toolState.result !== undefined) {
            return renderToolCompletionCard(
              toolState.toolName,
              toolState.result,
              toolState.isError || false,
              toolState.isExpanded || false,
              content
            );
          }
        }
        return h('div', {
          style: {
            padding: '8px',
            color: '#6b7280',
            fontSize: '12px'
          }
        }, '工具执行状态未知');
      } catch (error) {
        console.error('Error rendering tool execution:', error);
        return h('div', {
          style: {
            padding: '8px',
            color: '#dc2626',
            fontSize: '12px'
          }
        }, '工具执行渲染错误');
      }
    },
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

// 计算属性：合并历史消息和当前实时消息，并处理工具执行
const allMessages = computed(() => {
  const processedMessages: any[] = [];

  try {
    // 处理历史消息
    chatContentsStore.chatHistoryContent.forEach((item: any, index: number) => {
      const originalRole = item.messages[0].role;
      const role = originalRole === "assistant" ? "assistant_history" : originalRole;
      const content = filterDone(item.messages[0].content[0].text);
      const messageKey = `history_${item.timestamp || index}`;

      // 只有在真正检测到工具执行时才添加工具执行气泡
      const hasToolExecution = detectToolExecution(content, messageKey);
      if (hasToolExecution) {
        const toolState = toolExecutionStates.value.get(messageKey);
        if (toolState) {
          // 添加工具执行消息作为单独的气泡
          processedMessages.push({
            key: `${messageKey}_tool`,
            role: 'tool_execution',
            content: messageKey,
          });
        }
      }

      // 添加原始消息
      processedMessages.push({
        key: messageKey,
        role: role,
        content: content,
      });
    });

    // 处理当前消息
    chatContentsStore.currentChatMessages.forEach((item: any, index: number) => {
      // 对于流式响应，使用assistant角色；对于历史消息，使用assistant_history
      const role = item.role === 'assistant' && !item.streaming ? 'assistant_history' : item.role;
      const messageKey = item.key || `current_${index}`;

      console.log(`处理当前消息: key=${messageKey}, role=${role}, originalRole=${item.role}, streaming=${item.streaming}, content长度=${item.content?.length || 0}`);

      // 只有在真正检测到工具执行时才添加工具执行气泡
      const hasToolExecution = detectToolExecution(item.content, messageKey);
      if (hasToolExecution) {
        const toolState = toolExecutionStates.value.get(messageKey);
        if (toolState) {
          // 添加工具执行消息作为单独的气泡
          processedMessages.push({
            key: `${messageKey}_tool`,
            role: 'tool_execution',
            content: messageKey,
          });
        }
      }

      // 添加原始消息
      const messageToAdd = {
        key: messageKey,
        role: role,
        content: item.content,
      };

      console.log(`添加消息到渲染列表: key=${messageKey}, role=${role}, content预览="${item.content?.substring(0, 50)}..."`);
      processedMessages.push(messageToAdd);
    });

  } catch (error) {
    console.error('Error processing messages:', error);
  }

  console.log(`allMessages 计算完成: 总消息数=${processedMessages.length}`);
  processedMessages.forEach((msg, index) => {
    console.log(`  消息${index}: key=${msg.key}, role=${msg.role}, content长度=${msg.content?.length || 0}`);
  });

  return processedMessages;
});

watch(activeChatHistoryItem, async (newValue) => {
  if (newValue?.session_id) {
    console.log(
      "ChatBox: activeChatHistoryItem changed to:",
      newValue.session_id
    );

    // 标记正在加载历史消息
    isLoadingHistory.value = true;

    // 清空当前聊天消息，加载新的历史消息
    chatContentsStore.clearCurrentChat();

    await chatContentsStore.getChatHistoryContent(newValue.session_id);
    console.log(
      "ChatBox: chat content fetched:",
      chatContentsStore.chatHistoryContent
    );

    // 标记历史消息加载完成
    isLoadingHistory.value = false;
  }
});

// 监听当前聊天消息变化，确保实时更新
watch(
  () => chatContentsStore.currentChatMessages,
  (newMessages) => {
    console.log("ChatBox: currentChatMessages changed:", newMessages);

    // 检查新消息中的工具执行
    newMessages.forEach((message: any) => {
      if (message.role === 'assistant') {
        detectToolExecution(message.content, message.key);
      }
    });
  },
  { deep: true }
);

// 监听工具执行状态变化
watch(
  toolExecutionStates,
  (newStates) => {
    console.log("ChatBox: toolExecutionStates changed:", Array.from(newStates.entries()));
  },
  { deep: true }
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

// 清理工具执行状态
const clearToolExecutionStates = () => {
  toolExecutionStates.value.clear();
  console.log('Tool execution states cleared');
};

// 强制停止所有动画
const stopAllAnimations = () => {
  // 添加CSS规则来停止所有动画
  const style = document.createElement('style');
  style.textContent = `
    * {
      animation: none !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(style);

  // 清理工具执行状态
  clearToolExecutionStates();

  console.log('All animations stopped');
};

// 手动测试工具执行检测（仅在需要时调用）
const manualTestToolExecution = () => {
  try {
    console.log('Manual tool execution test...');

    // 清理现有状态
    clearToolExecutionStates();

    // 测试工具执行模式
    const testExecution = '```json{"tool":"create_wordcloud_chart","arguments":{"text":"test"}}```';
    const result1 = detectToolExecution(testExecution, 'manual_test_execution');
    console.log('Test execution result:', result1);

    // 测试工具完成模式
    const testCompletion = '{"params":{"tool":"create_wordcloud_chart","arguments":{"text":"test"}},"tool_response":"Test result","is_error":false}';
    const result2 = detectToolExecution(testCompletion, 'manual_test_completion');
    console.log('Test completion result:', result2);

    console.log('Tool execution states after test:', toolExecutionStates.value.size);
  } catch (error) {
    console.error('Error in manual test function:', error);
  }
};

// 暴露调试函数到全局，方便调试
if (import.meta.env.DEV) {
  (window as any).clearToolStates = clearToolExecutionStates;
  (window as any).testToolExecution = manualTestToolExecution;
  (window as any).stopAllAnimations = stopAllAnimations;
}

onMounted(async () => {
  try {
    await chatContentsStore.getChatHistoryContent(
      activeChatHistoryItem.value?.session_id || ""
    );

    // 强制停止所有动画并清理状态
    stopAllAnimations();

    console.log('ChatBox mounted, all animations stopped and states cleared');
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
