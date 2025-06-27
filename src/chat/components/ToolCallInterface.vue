<template>
  <div class="tool-call-interface">
    <ToolCallBlock
      v-for="call in calls"
      :key="call.id"
      :response="{
        params: JSON.stringify(call.arguments),
        tool_response: call.result || '',
        is_error: String(call.status === 'error')
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToolCallsStore } from '../../store/tool_calls'
import ToolCallBlock from './ToolCallBlock.vue'

const props = defineProps<{ messageKey: string }>()
const toolCallsStore = useToolCallsStore()
const calls = computed(() =>
  toolCallsStore.getToolCallsByMessageKey(props.messageKey)
)
</script>

<style scoped>
.tool-call-interface {
  margin-bottom: 0.5rem;
}
</style>
