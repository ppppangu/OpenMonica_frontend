<template>
  <a-layout style="height: 100vh">
    <a-layout-sider width="260" breakpoint="lg" collapsed-width="0">
      <!-- TODO: ChatHistoryList 侧边栏 -->
      <div style="padding: 16px; color: #999">对话列表（开发中）</div>
    </a-layout-sider>

    <a-layout>
      <a-layout-content style="padding: 16px; height: 100%; display: flex; flex-direction: column">
        <!-- 消息展示区域 -->
        <ChatMessageList
          ref="messageListRef"
          :messages="messages"
          style="flex: 1 1 auto; overflow-y: auto"
        />

        <!-- 输入区域 -->
        <ChatFrame
          style="flex: 0 0 auto; margin-top: 12px"
          @send="handleSend"
          @incoming="handleIncoming"
        />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatMessage } from './types'
import ChatFrame from './ChatFrame.vue'
import ChatMessageList from './ChatMessageList.vue'

const messages = ref<ChatMessage[]>([])

function handleSend(msg: ChatMessage) {
  messages.value.push(msg)
}

function handleIncoming(msg: ChatMessage) {
  messages.value.push(msg)
}
</script>

<style scoped>
/* 先行占位样式，后续根据 Ant Design 主题调整 */
</style> 