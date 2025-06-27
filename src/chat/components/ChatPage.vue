<template>
  <div class="chat-page">
    <h2>Streaming Demo</h2>
    <div class="stream-output" v-html="html"></div>
    <button class="btn-primary" @click="startDemo">Start Streaming Demo</button>
    <pre class="debug">{{ state.x }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createBubbleState, addChunk, type Chunk } from '../../utils/streamingUpdate'
import { parseX, renderSegmentsToHtml } from '../../utils/streamingRender'

const html = ref('')
const state = createBubbleState()

const demoChunks: Chunk[] = [
  { reasoning_content: '模型正在思考...' },
  { reasoning_content: '进一步分析中...' },
  { content: '最终结果如下：' },
  { content: '1. 你好 世界 <https://example.com>' },
  { content: '```json\n{"tool":"translate","arguments":{"text":"你好","language":"German"}}\n```' },
  { content: '```json\n{"params":"{\\"tool\\":\\"translate\\",\\"arguments\\":{\\"text\\":\\"你好\\",\\"language\\":\\"German\\"}}","tool_response":"Guten Tag","is_error":"false"}\n```' }
]

function startDemo() {
  html.value = ''
  state.x = ''
  let idx = 0
  const timer = setInterval(() => {
    const chunk = demoChunks[idx++]
    if (!chunk) {
      clearInterval(timer)
      return
    }
    addChunk(state, chunk)
    html.value = renderSegmentsToHtml(parseX(state.x))
  }, 1000)
}
</script>

<style scoped>
.chat-page {
  padding: 20px;
}
.stream-output {
  border: 1px dashed #999;
  min-height: 100px;
  padding: 10px;
  margin-bottom: 10px;
}
pre.debug {
  background: #f5f5f5;
  padding: 10px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
