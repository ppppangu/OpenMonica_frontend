<template>
  <div class="simple-chat-frame" style="border: 2px solid #f59e0b; padding: 20px; min-height: 200px; background: #fafafa;">
    <h3>Simple ChatFrame Test</h3>
    <div style="margin: 10px 0;">
      <input 
        v-model="inputText" 
        type="text" 
        placeholder="Type a message..." 
        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
      />
    </div>
    <div style="margin: 10px 0;">
      <button 
        @click="sendMessage" 
        style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        Send Message
      </button>
    </div>
    <div v-if="message" style="margin: 10px 0; padding: 10px; background: #e5f3ff; border-radius: 4px;">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputText = ref('')
const message = ref('')

onMounted(() => {
  console.log('🎯 SimpleChatFrame mounted successfully!')
  message.value = 'SimpleChatFrame component is working!'
})

const sendMessage = () => {
  if (inputText.value.trim()) {
    message.value = `You said: ${inputText.value}`
    inputText.value = ''
  }
}
</script>
