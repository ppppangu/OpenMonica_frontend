<template>
  <div :class="['chat-message-item', message.role]">
    <template v-if="message.isToolCall && message.toolResponse">
      <ToolCallBlock :response="message.toolResponse" />
    </template>
    <template v-else>
      <StreamingMarkdown :text="message.content" :reasoning="message.reasoning_content" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { ChatMessage } from './types'
import ToolCallBlock from './ToolCallBlock.vue'
import StreamingMarkdown from './StreamingMarkdown.vue'

const props = defineProps({
  message: {
    type: Object as PropType<ChatMessage>,
    required: true
  }
})
</script>

<style scoped>
.chat-message-item {
  margin-bottom: 12px;
}
.chat-message-item.user {
  text-align: right;
}
.chat-message-item.assistant {
  text-align: left;
}
</style> 