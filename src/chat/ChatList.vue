
<script setup lang="ts">
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue';
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
    // 显示确认对话框
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${conversationLabel}" 吗？此操作不可撤销。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
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

// 使用computed保持响应式，添加图标到store数据
const items = computed(() => {
  console.log('ChatList items computed, chatHistoryList:', chatHistoryStore.chatHistoryList)
  return chatHistoryStore.chatHistoryList.map(item => ({
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

const style = computed(() => ({
  width: '256px',
  background: token.value.colorBgContainer,
  borderRadius: token.value.borderRadius,
}));

const menuConfig: ConversationsProps['menu'] = (conversation) => ({
  items: [
    {
      label: 'Delete',
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
  <div v-if="items.length === 0" class="p-4 text-gray-500 text-center">
    <p>暂无聊天记录</p>
    <p class="text-sm">开始新的对话吧！</p>
  </div>
  <Conversations
    v-else
    :default-active-key="items[0]?.key"
    :menu="menuConfig"
    :items="items"
    :style="style"
    @activeChange="handleClick"
  />
</template>