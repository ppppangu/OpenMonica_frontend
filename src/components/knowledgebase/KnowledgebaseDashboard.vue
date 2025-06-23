<template>
  <div class="dashboard-container p-6">
    <h2 class="text-2xl font-semibold mb-4">知识库概览</h2>
    <p class="text-gray-600 mb-6">(统计信息与图表后续补充)</p>

    <!-- 示例统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">文档总数</h3>
        <p class="text-3xl font-bold text-indigo-600">{{ stats.totalDocuments }}</p>
      </div>
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">知识点</h3>
        <p class="text-3xl font-bold text-indigo-600">{{ stats.totalNodes }}</p>
      </div>
      <div class="stat-card bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-2">关系数量</h3>
        <p class="text-3xl font-bold text-indigo-600">{{ stats.totalEdges }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKnowledgebaseViewStore } from '../../store/knowledgebase_view'

defineOptions({ name: 'KnowledgebaseDashboard' })

const viewStore = useKnowledgebaseViewStore()
const stats = computed(() => viewStore.stats || { totalDocuments: 0, totalNodes: 0, totalEdges: 0 })
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
}
</style> 