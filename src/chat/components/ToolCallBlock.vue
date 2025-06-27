<template>
  <a-collapse :bordered="false">
    <a-collapse-panel :header="panelHeader">
      <pre style="white-space: pre-wrap">{{ prettyJson }}</pre>
    </a-collapse-panel>
  </a-collapse>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'

interface ToolResponse {
  params: string
  tool_response: string
  is_error: string
}

const props = defineProps({
  response: {
    type: Object as PropType<ToolResponse>,
    required: true
  }
})

const panelHeader = computed(() => {
  return `🔧 工具调用 ${props.response.is_error === 'true' ? '❌ 错误' : '✅ 完成'}`
})

const prettyJson = computed(() => {
  try {
    return JSON.stringify(JSON.parse(props.response.params), null, 2) +
      '\n\n输出:\n' + props.response.tool_response
  } catch (e) {
    return props.response.tool_response
  }
})
</script>

<style scoped>
pre {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style> 