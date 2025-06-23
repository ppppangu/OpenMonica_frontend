<template>
  <a-list :data-source="messages" bordered>
    <template #header>
      <strong>聊天记录</strong>
    </template>

    <template #renderItem="{ item }">
      <a-list-item>
        <ChatMessageItem :message="item" />
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { ChatMessage } from './types'
import ChatMessageItem from './ChatMessageItem.vue'

const props = defineProps({
  messages: {
    type: Array as PropType<ChatMessage[]>,
    default: () => []
  }
})
</script>

<style scoped>
</style> 