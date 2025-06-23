<template>
  <div class="detail-container flex h-full">
    <!-- 左侧文档列表 -->
    <aside class="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 h-full overflow-hidden">
      <DocumentList class="h-full" />
    </aside>

    <!-- 右侧预览区域 -->
    <section class="flex-1 h-full relative bg-gray-100">
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        class="w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms allow-downloads"
      />
      <div v-else class="flex items-center justify-center h-full text-gray-500">
        请选择左侧文档以进行预览
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKnowledgebaseViewStore } from '../../store/knowledgebase_view'
import DocumentList from './DocumentList.vue'
import { useKnowledgeBaseDetailStore } from '../../store/knowledgebase_detail'

defineOptions({ name: 'KnowledgebaseDetail' })

// 当前视图 store（未来可根据需求使用）
const viewStore = useKnowledgebaseViewStore()

// 文档详情 store
const detailStore = useKnowledgeBaseDetailStore()

// 预览地址
const previewUrl = computed(() => detailStore.activeDocumentDetail?.preview_url || '')
</script>

<style scoped>
.detail-container {
  min-height: 100%;
}
</style> 