<template>
  <div class="graph-container h-full relative">
    <!-- 区域1：控制面板 -->
    <div class="graph-control-panel absolute top-4 right-4 bg-white shadow rounded-lg p-4 z-10">
      <h3 class="font-medium mb-2">图谱控制</h3>
      <button class="btn" @click="refreshGraph">刷新</button>
    </div>

    <!-- 区域2：图谱画布 -->
    <div ref="canvasRef" class="graph-canvas w-full h-full"></div>

    <!-- 区域3：节点详情抽屉 -->
    <div
      v-if="selectedNode"
      class="node-drawer fixed top-0 right-0 w-80 h-full bg-white shadow-lg p-6 overflow-y-auto"
    >
      <h3 class="text-xl font-semibold mb-4">节点详情</h3>
      <pre class="whitespace-pre-wrap text-sm">{{ selectedNode }}</pre>
      <button class="mt-4 btn" @click="selectedNode = null">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useKnowledgebaseViewStore } from '../../store/knowledgebase_view'

defineOptions({ name: 'KnowledgeGraph' })

const canvasRef = ref<HTMLElement | null>(null)
const selectedNode = ref<any>(null)

const refreshGraph = () => {
  // TODO: 加载/刷新图谱数据并渲染至 canvas
  console.log('Refresh graph')
}

onMounted(() => {
  refreshGraph()
})
</script>

<style scoped>
.graph-container {
  background: #f9fafb;
}
.graph-canvas {
  width: 100%;
  height: 100%;
}
.btn {
  @apply px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700;
}
</style> 