
<script setup lang="ts">
import { DeleteOutlined, EditOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { theme, message, Modal } from 'ant-design-vue';
import { Conversations, type ConversationsProps } from 'ant-design-x-vue';
import { computed, h, onMounted, watch } from 'vue';
import { useChatHistoryStore } from '../store/chat_history'

const chatHistoryStore = useChatHistoryStore()

defineOptions({ name: 'ChatList' });

const [messageApi, contextHolder] = message.useMessage();
const { token } = theme.useToken();

// 删除聊天记录的处理函数
const handleDeleteChatHistory = async (sessionId: string, conversationLabel: string) => {
  try {
    // 显示确认对话框，使用增强的样式
    Modal.confirm({
      title: '确认删除聊天记录',
      content: h('div', { class: 'delete-confirmation-content' }, [
        h('p', { class: 'delete-warning' }, `确定要删除 "${conversationLabel}" 吗？`),
        h('p', { class: 'delete-notice' }, '此操作不可撤销，聊天记录将永久丢失。')
      ]),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      width: 420,
      centered: true,
      onOk: async () => {
        let loadingMessage: any = null
        try {
          // 显示加载消息
          loadingMessage = messageApi.loading('正在删除聊天记录...', 0)

          // 调用store的删除方法
          await chatHistoryStore.deleteChatHistory(sessionId)

          // 关闭加载消息
          if (loadingMessage) {
            loadingMessage()
          }

          // 显示成功消息
          messageApi.success('聊天记录删除成功')

          console.log('Chat history deleted successfully:', sessionId)

          // 删除成功后刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 1000) // 延迟1秒刷新，让用户看到成功消息
        } catch (error) {
          // 确保加载消息被关闭
          if (loadingMessage) {
            loadingMessage()
          }

          console.error('Delete chat history failed:', error)
          const errorMessage = error instanceof Error ? error.message : '删除失败，请稍后重试'
          messageApi.error(errorMessage)
        }
      }
    })
  } catch (error) {
    console.error('Error in handleDeleteChatHistory:', error)
    messageApi.error('操作失败，请稍后重试')
  }
}

// 使用computed保持响应式，添加图标到store数据，并反转顺序使最新对话在顶部
const items = computed(() => {
  console.log('ChatList items computed, chatHistoryList:', chatHistoryStore.chatHistoryList)
  return chatHistoryStore.chatHistoryList
    .slice() // 创建副本避免修改原数组
    .reverse() // 反转顺序，最新的在顶部
    .map(item => ({
      ...item,
      icon: h(EditOutlined)
    }))
})

const handleClick = (activeKey: string) => {
  console.log('ChatList handleClick, activeKey:', activeKey)
  console.log('Setting active chat history item to:', activeKey)
  if (activeKey) {
    chatHistoryStore.setActiveChatHistoryItem(activeKey)
  } else {
    console.warn('ActiveKey is undefined or empty')
  }
  // 不需要在这里直接调用getChatHistoryContent，因为ChatBox.vue中的watch会处理
}

// 监听数据变化用于调试
watch(() => chatHistoryStore.chatHistoryList, (newList) => {
  console.log('ChatList: chatHistoryList changed:', newList)
}, { deep: true })

// 监听活跃项变化用于调试
watch(() => chatHistoryStore.activeChatHistoryItem, (newActive) => {
  console.log('ChatList: activeChatHistoryItem changed:', newActive)
}, { deep: true })

// 组件挂载时确保数据已加载
onMounted(async () => {
  console.log('ChatList mounted, current items:', items.value)
  // 如果没有数据，尝试重新获取
  if (items.value.length === 0) {
    console.log('No chat history items, fetching...')
    await chatHistoryStore.getChatHistoryList()
  }
})

// Enhanced styling inspired by help.html design
const style = computed(() => ({
  width: '256px',
  background: token.value.colorBgContainer,
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
}));

// Custom CSS classes for enhanced styling
const chatListClasses = computed(() => ({
  'chat-list-enhanced': true,
  'chat-list-empty': items.value.length === 0,
}));

const menuConfig: ConversationsProps['menu'] = (conversation) => ({
  items: [
    {
      label: '删除对话',
      key: 'delete',
      icon: h(DeleteOutlined),
      danger: true,
    },
  ],
  // 设置删除的点击事件
  onClick: (menuInfo) => {
    if (menuInfo.key === 'delete') {
      // 调用删除处理函数
      const labelText = typeof conversation.label === 'string' ? conversation.label : 'Unknown Conversation'
      handleDeleteChatHistory(conversation.key, labelText)
    }
  },
});
</script>
<template>
  <contextHolder />
  <div
    v-if="items.length === 0"
    class="chat-list-empty-state"
    :style="style"
  >
    <div class="empty-state-content">
      <div class="empty-state-icon">
        <MessageOutlined />
      </div>
      <h3 class="empty-state-title">暂无聊天记录</h3>
      <p class="empty-state-description">开始新的对话，创建您的第一个聊天记录</p>
      <div class="empty-state-action">
        <PlusOutlined class="action-icon" />
        <span>点击开始新对话</span>
      </div>
    </div>
  </div>
  <div
    v-else
    class="chat-list-container"
    :class="chatListClasses"
  >
    <Conversations
      :default-active-key="items[0]?.key"
      :menu="menuConfig"
      :items="items"
      :style="style"
      @activeChange="handleClick"
    />
  </div>
</template>

<style scoped>
/* Enhanced ChatList styling inspired by help.html design */

/* Empty state styling */
.chat-list-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
}

.empty-state-content {
  text-align: center;
  max-width: 200px;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.empty-state-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.empty-state-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.empty-state-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3e8ff;
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  color: #7c3aed;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-state-action:hover {
  background: #ede9fe;
  border-color: #ddd6fe;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.action-icon {
  font-size: 12px;
}

/* Chat list container styling */
.chat-list-container {
  position: relative;
}

/* Enhanced Conversations component styling */
.chat-list-container :deep(.ant-conversations) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.chat-list-container :deep(.ant-conversations-item) {
  margin-bottom: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.chat-list-container :deep(.ant-conversations-item:hover) {
  background: #f9fafb !important;
  border-color: #e5e7eb;
  transform: translateX(2px);
}

.chat-list-container :deep(.ant-conversations-item-active) {
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%) !important;
  border-color: #c4b5fd !important;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15) !important;
}

.chat-list-container :deep(.ant-conversations-item-active:hover) {
  transform: translateX(0);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2) !important;
}

.chat-list-container :deep(.ant-conversations-item-content) {
  padding: 12px 16px;
}

.chat-list-container :deep(.ant-conversations-item-title) {
  font-weight: 500 !important;
  color: #374151 !important;
  font-size: 14px !important;
}

.chat-list-container :deep(.ant-conversations-item-active .ant-conversations-item-title) {
  color: #7c3aed !important;
  font-weight: 600 !important;
}

.chat-list-container :deep(.ant-conversations-item-icon) {
  color: #6b7280 !important;
  transition: color 0.2s ease;
}

.chat-list-container :deep(.ant-conversations-item-active .ant-conversations-item-icon) {
  color: #7c3aed !important;
}

.chat-list-container :deep(.ant-conversations-item:hover .ant-conversations-item-icon) {
  color: #374151 !important;
}

/* Menu styling */
.chat-list-container :deep(.ant-dropdown-menu) {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e5e7eb !important;
}

.chat-list-container :deep(.ant-dropdown-menu-item) {
  border-radius: 6px !important;
  margin: 4px !important;
  transition: all 0.2s ease !important;
}

.chat-list-container :deep(.ant-dropdown-menu-item:hover) {
  background: #fef2f2 !important;
}

.chat-list-container :deep(.ant-dropdown-menu-item-danger:hover) {
  background: #fef2f2 !important;
  color: #dc2626 !important;
}

/* Scrollbar styling */
.chat-list-container :deep(.ant-conversations-list) {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f9fafb;
}

.chat-list-container :deep(.ant-conversations-list::-webkit-scrollbar) {
  width: 6px;
}

.chat-list-container :deep(.ant-conversations-list::-webkit-scrollbar-track) {
  background: #f9fafb;
  border-radius: 3px;
}

.chat-list-container :deep(.ant-conversations-list::-webkit-scrollbar-thumb) {
  background: #d1d5db;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.chat-list-container :deep(.ant-conversations-list::-webkit-scrollbar-thumb:hover) {
  background: #9ca3af;
}

/* Modal styling for delete confirmation */
:deep(.ant-modal-confirm) {
  .ant-modal-content {
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
  }

  .ant-modal-header {
    border-bottom: 1px solid #f3f4f6 !important;
    padding: 20px 24px 16px !important;
  }

  .ant-modal-title {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #374151 !important;
  }

  .ant-modal-body {
    padding: 20px 24px !important;
  }

  .delete-confirmation-content {
    .delete-warning {
      font-size: 14px;
      color: #374151;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .delete-notice {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
    }
  }

  .ant-modal-confirm-btns {
    margin-top: 20px !important;

    .ant-btn {
      border-radius: 8px !important;
      font-weight: 500 !important;
      height: 36px !important;
      padding: 0 16px !important;
    }

    .ant-btn-primary {
      background: #dc2626 !important;
      border-color: #dc2626 !important;

      &:hover {
        background: #b91c1c !important;
        border-color: #b91c1c !important;
      }
    }

    .ant-btn-default {
      border-color: #d1d5db !important;
      color: #374151 !important;

      &:hover {
        border-color: #9ca3af !important;
        color: #111827 !important;
      }
    }
  }
}
</style>