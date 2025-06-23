<template>
  <div class="streaming-markdown" v-html="html"></div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ linkify: true, breaks: true })

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  reasoning: {
    type: String as PropType<string | null>,
    default: null
  }
})

const html = computed(() => {
  const combined = props.reasoning ? props.reasoning + '\n' + props.text : props.text
  return md.render(combined)
})
</script>

<style scoped>
.streaming-markdown {
  word-break: break-word;
}
</style> 