<template>
  <div class="tool-call-interface" v-if="toolCalls.length">
    <div
      v-for="call in toolCalls"
      :key="call.id"
      class="tool-call-item"
    >
      <button class="tool-call-header" @click="toggle(call.id)">
        <span class="material-icons mr-1">
          {{ call.isExpanded ? 'expand_less' : 'expand_more' }}
        </span>
        <span class="tool-call-name">{{ call.toolName }}</span>
        <span class="tool-call-status" :class="call.status">
          <template v-if="call.status === 'invoking'">运行中...</template>
          <template v-else-if="call.status === 'done'">已完成</template>
          <template v-else>错误</template>
        </span>
      </button>
      <div v-if="call.isExpanded" class="tool-call-body">
        <pre class="tool-call-args">{{ formatArguments(call.arguments) }}</pre>
        <div v-if="call.status !== 'invoking'" class="tool-call-result">
          <pre>{{ call.result || call.error }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useToolCallsStore } from '../store/tool_calls'

const props = defineProps<{ messageKey: string }>()

const store = useToolCallsStore()

const toolCalls = computed(() =>
  store.getToolCallsByMessageKey(props.messageKey)
)

const toggle = (id: string) => {
  store.toggleToolCallExpansion(id)
}

watch(
  toolCalls,
  (newCalls, oldCalls) => {
    newCalls.forEach((call, idx) => {
      const prev = oldCalls[idx]
      if (prev && prev.status === 'invoking' && call.status !== 'invoking') {
        if (call.isExpanded) {
          store.toggleToolCallExpansion(call.id)
        }
      }
    })
  }
)

const formatArguments = (args: Record<string, any>) => {
  try {
    return JSON.stringify(args, null, 2)
  } catch {
    return String(args)
  }
}
</script>

<style scoped>
.tool-call-interface {
  margin: 8px 0;
}
.tool-call-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #f9fafb;
}
.tool-call-header {
  width: 100%;
  text-align: left;
  background: #f3f4f6;
  padding: 4px 8px;
  border: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.tool-call-name {
  margin-right: auto;
}
.tool-call-status {
  font-size: 12px;
}
.tool-call-status.invoking {
  color: #2563eb;
}
.tool-call-status.done {
  color: #16a34a;
}
.tool-call-status.error {
  color: #dc2626;
}
.tool-call-body {
  padding: 6px 8px;
  background: #fff;
}
.tool-call-args,
.tool-call-result pre {
  white-space: pre-wrap;
  font-size: 12px;
  margin: 0;
}
</style>
