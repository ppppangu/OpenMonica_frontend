<template>
  <div class="chat-frame">
    <a-input-textarea
      v-model:value="input"
      :rows="3"
      placeholder="Ctrl+Enter 发送，支持 Markdown"
      @keydown.ctrl.enter="handleSend"
    />
    <div class="chat-frame__footer">
      <a-space>
        <!-- 扩展按钮区域 -->
        <a-button type="primary" :disabled="!input.trim()" @click="handleSend">发送</a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatMessage } from './types'

const emit = defineEmits<{
  (e: 'send', msg: ChatMessage): void
}>()

const input = ref('')

function handleSend() {
  if (!input.value.trim()) return
  const msg: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: input.value.trim()
  }
  emit('send', msg)
  input.value = ''
}
</script>

<style scoped>
.chat-frame {
  border: 1px solid #f0f0f0;
  padding: 12px;
  border-radius: 4px;
  background: #fafafa;
}
.chat-frame__footer {
  margin-top: 8px;
  text-align: right;
}
</style> 