<template>
  <div class="document-list-container">
    <!-- 文件列表头部 -->
    <div class="file-list-header">
      <div class="file-list-title-section">
        <h2 class="file-list-title">文档列表</h2>
        <span class="file-list-count">{{ documentDetailList.length }}个文档</span>
      </div>
      <!-- 搜索框 -->
      <div class="file-list-search">
        <input 
          type="text" 
          placeholder="搜索文档..." 
          class="search-input"
          v-model="searchQuery"
        >
        <span class="material-icons search-icon">search</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载文档...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <span class="material-icons">error_outline</span>
      </div>
      <p class="error-text">{{ error }}</p>
      <button class="retry-btn" @click="handleRetry">
        <span class="material-icons">refresh</span>
        重试
      </button>
    </div>

    <!-- 文档列表 -->
    <div v-else class="file-list-content">
      <div 
        v-for="document in filteredDocuments" 
        :key="document.document_id"
        :class="['file-item', { 'file-item-active': isActiveDocument(document) }]"
        @click="handleDocumentClick(document)"
      >
        <div class="file-item-icon">
          <span class="material-icons">{{ getFileIcon(document.file_type) }}</span>
        </div>
        <div class="file-item-content">
          <div class="file-item-title">{{ document.document_name }}</div>
          <div class="file-item-meta">
            {{ document.file_type }} • {{ document.file_size }} • {{ document.upload_time }}
          </div>
        </div>
        <div class="file-item-actions">
          <button class="file-action-btn" @click="handleDownload(document, $event)">
            <span class="material-icons">download</span>
          </button>
          <button class="file-action-btn" @click="handleMenu(document, $event)">
            <span class="material-icons">more_vert</span>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredDocuments.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">
          <span class="material-icons">description</span>
        </div>
        <h3 class="empty-title">暂无文档</h3>
        <p class="empty-desc">{{ searchQuery ? '没有找到匹配的文档' : '这个知识库还没有文档' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useKnowledgeBaseDetailStore } from '../store/knowledgebase_detail'

defineOptions({ name: 'DocumentList' })

// Store
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()

// Local state
const searchQuery = ref('')

// Computed properties
const documentDetailList = computed(() => knowledgeBaseDetailStore.documentDetailList)
const activeDocumentDetail = computed(() => knowledgeBaseDetailStore.activeDocumentDetail)
const isLoading = computed(() => knowledgeBaseDetailStore.isLoading)
const error = computed(() => knowledgeBaseDetailStore.error)

const filteredDocuments = computed(() => {
  if (!searchQuery.value) {
    return documentDetailList.value
  }
  return documentDetailList.value.filter(doc => 
    doc.document_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Methods
const isActiveDocument = (document: any) => {
  return activeDocumentDetail.value?.document_id === document.document_id
}

const getFileIcon = (fileType?: string) => {
  switch (fileType?.toUpperCase()) {
    case 'PDF':
      return 'picture_as_pdf'
    case 'DOCX':
    case 'DOC':
      return 'description'
    case 'TXT':
      return 'text_snippet'
    case 'MD':
      return 'article'
    default:
      return 'insert_drive_file'
  }
}

// Event handlers
const handleDocumentClick = (document: any) => {
  console.log('Document clicked:', document)
  knowledgeBaseDetailStore.setActiveDocumentDetail(document)
}

const handleDownload = (document: any, event: Event) => {
  event.stopPropagation()
  console.log('Download document:', document)
  // TODO: 实现文档下载功能
}

const handleMenu = (document: any, event: Event) => {
  event.stopPropagation()
  console.log('Document menu clicked:', document)
  // TODO: 显示文档菜单选项
}

const handleRetry = () => {
  knowledgeBaseDetailStore.clearError()
  knowledgeBaseDetailStore.fetchKnowledgeBaseDetail()
}

// 监听文档列表变化，自动选择第一个文档
watch(documentDetailList, (newList) => {
  if (newList.length > 0 && !activeDocumentDetail.value) {
    const firstDocument = newList[0]
    knowledgeBaseDetailStore.setActiveDocumentDetail(firstDocument)
    console.log('Auto-selected first document from list:', firstDocument.document_name)
  }
}, { immediate: true })
</script>

<style scoped>
.document-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.file-list-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.file-list-title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.file-list-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.file-list-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.file-list-search {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.25rem;
}

.file-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.75rem 1.5rem 0.75rem;
  background: #fafbfc;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.file-item:hover:not(.file-item-active) {
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.file-item.file-item-active {
  background: #f0f4ff;
  border-color: #7c3aed;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
  transform: translateY(-1px);
}

.file-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.file-item.file-item-active .file-item-icon {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.file-item-icon .material-icons {
  font-size: 1.25rem;
}

.file-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-item-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-item.file-item-active .file-item-title {
  color: #7c3aed;
}

.file-item-meta {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.3;
}

.file-item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: all 0.2s ease;
  transform: translateX(8px);
}

.file-item:hover .file-item-actions {
  opacity: 1;
  transform: translateX(0);
}

.file-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 6px;
  background: #f8fafc;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.file-action-btn:hover {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
  transform: scale(1.05);
}

.file-action-btn .material-icons {
  font-size: 1rem;
}

/* Loading, Error, Empty states */
.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text,
.error-text,
.empty-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.error-icon,
.empty-icon {
  color: #9ca3af;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-icon .material-icons,
.empty-icon .material-icons {
  font-size: 3rem;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: #6d28d9;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
