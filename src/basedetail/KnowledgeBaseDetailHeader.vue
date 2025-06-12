<template>
  <div class="header-content">
    <div class="header-left">
      <a href="/src/knowledgebase/knowledgebase.html" class="header-back-btn">
        <span class="material-icons">arrow_back</span>
      </a>
      <div class="header-title-section">
        <h1 class="header-title">{{ knowledgeBaseName }}</h1>
        <p class="header-subtitle">{{ knowledgeBaseDescription }} • {{ documentCount }}个文档</p>
      </div>
    </div>
    <div class="header-actions">
      <button class="header-action-btn header-action-secondary" @click="handleUpload">
        <span class="material-icons">upload</span>
        <span>上传文档</span>
      </button>
      <button class="header-action-btn header-action-primary" @click="handleCreateNew">
        <span class="material-icons">add</span>
        <span>新建文档</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useKnowledgeBaseDetailStore } from '../store/knowledgebase_detail'

defineOptions({ name: 'KnowledgeBaseDetailHeader' })

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()

// Computed properties
const knowledgeBaseName = computed(() => 
  knowledgeBaseStore.activeKnowledgeBaseItem?.name || '知识库详情'
)

const knowledgeBaseDescription = computed(() => 
  knowledgeBaseStore.activeKnowledgeBaseItem?.description || '暂无描述'
)

const documentCount = computed(() => 
  knowledgeBaseDetailStore.documentDetailList.length
)

// Event handlers
const handleUpload = () => {
  console.log('Upload document clicked')
  // TODO: 实现文档上传功能
}

const handleCreateNew = () => {
  console.log('Create new document clicked')
  // TODO: 实现新建文档功能
}
</script>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s ease;
}

.header-back-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.header-back-btn .material-icons {
  font-size: 1.25rem;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-action-secondary {
  background: #f3f4f6;
  color: #374151;
}

.header-action-secondary:hover {
  background: #e5e7eb;
}

.header-action-primary {
  background: #7c3aed;
  color: white;
}

.header-action-primary:hover {
  background: #6d28d9;
}

.header-action-btn .material-icons {
  font-size: 1rem;
}
</style>
