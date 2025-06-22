<template>
  <div class="document-management">
    <!-- Header Section -->
    <div class="doc-header">
      <div class="doc-header-info">
        <h2 class="doc-title">{{ knowledgeBase.name }} - 文档管理</h2>
        <p class="doc-subtitle">{{ knowledgeBase.description || '暂无描述' }}</p>
      </div>
      <div class="doc-header-actions">
        <a-button 
          type="primary" 
          size="large"
          @click="showUploadModal = true"
          class="upload-btn"
        >
          <template #icon>
            <span class="material-icons">upload_file</span>
          </template>
          上传文档
        </a-button>
      </div>
    </div>

    <!-- Content Layout -->
    <div class="doc-content">
      <!-- Left Panel - Document List -->
      <div class="doc-list-panel" ref="docListPanel">
        <div class="panel-header">
          <h3 class="panel-title">文档列表</h3>
          <span class="doc-count">{{ documentList.length }} 个文档</span>
        </div>

        <!-- Search and Filter -->
        <div class="doc-controls">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="搜索文档..."
            size="large"
            class="doc-search"
          >
            <template #prefix>
              <span class="material-icons">search</span>
            </template>
          </a-input-search>
          
          <a-select
            v-model:value="sortBy"
            size="large"
            style="width: 160px"
            @change="handleSortChange"
          >
            <a-select-option value="upload_time">上传时间</a-select-option>
            <a-select-option value="name">文档名称</a-select-option>
            <a-select-option value="size">文件大小</a-select-option>
          </a-select>
        </div>

        <!-- Document List -->
        <div class="doc-list">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <a-spin size="large" />
            <p>正在加载文档...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredDocuments.length === 0" class="empty-state">
            <div class="empty-icon">
              <span class="material-icons">description</span>
            </div>
            <h4>暂无文档</h4>
            <p>上传您的第一个文档开始构建知识库</p>
          </div>

          <!-- Document Items -->
          <div
            v-else
            v-for="doc in filteredDocuments"
            :key="doc.document_id"
            :class="['doc-item', { 'doc-item-active': activeDocument?.document_id === doc.document_id }]"
            @click="handleDocumentClick(doc)"
          >
            <div class="doc-item-icon">
              <span class="material-icons">{{ getFileIcon(doc.file_type) }}</span>
            </div>
            
            <div class="doc-item-content">
              <h4 class="doc-item-title">{{ doc.document_name }}</h4>
              <div class="doc-item-meta">
                <span class="doc-type">{{ doc.file_type || 'PDF' }}</span>
                <span class="doc-size">{{ doc.file_size || '未知大小' }}</span>
                <span class="doc-date">{{ formatDate(doc.upload_time) }}</span>
              </div>
            </div>

            <div class="doc-item-actions">
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <a-button type="text" size="small" @click.stop>
                  <span class="material-icons">more_vert</span>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="handlePreview(doc)">
                      <span class="material-icons menu-icon">visibility</span>
                      预览
                    </a-menu-item>
                    <a-menu-item @click="handleDownload(doc)">
                      <span class="material-icons menu-icon">download</span>
                      下载
                    </a-menu-item>
                    <a-menu-item @click="handleDelete(doc)" class="delete-item">
                      <span class="material-icons menu-icon">delete</span>
                      删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize Handle -->
      <div class="resize-handle" ref="resizeHandle"></div>

      <!-- Right Panel - Document Preview -->
      <div class="doc-preview-panel">
        <DocumentPreview 
          :document="activeDocument"
          @document-load-error="handlePreviewError"
        />
      </div>
    </div>

    <!-- Upload Modal -->
    <DocumentUploadModal
      v-model:visible="showUploadModal"
      :knowledge-base="knowledgeBase"
      @documents-uploaded="handleDocumentsUploaded"
    />

    <!-- Delete Confirmation Modal -->
    <a-modal
      v-model:open="showDeleteModal"
      title="删除文档"
      :confirm-loading="isDeleting"
      @ok="confirmDelete"
      @cancel="showDeleteModal = false"
      ok-text="确认删除"
      cancel-text="取消"
      ok-type="danger"
    >
      <div class="delete-modal-content">
        <div class="warning-icon">
          <span class="material-icons">warning</span>
        </div>
        <div class="warning-text">
          <p>确定要删除文档 <strong>{{ deletingDocument?.document_name }}</strong> 吗？</p>
          <p class="warning-note">此操作不可撤销。</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useKnowledgeBaseDetailStore } from '../../store/knowledgebase_detail'
import DocumentPreview from './DocumentPreview.vue'
import DocumentUploadModal from './DocumentUploadModal.vue'

defineOptions({ name: 'DocumentManagement' })

// Props
const props = defineProps<{
  knowledgeBase: {
    id: string
    name: string
    description?: string
  }
}>()

// Store
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()

// Reactive state
const searchQuery = ref('')
const sortBy = ref('upload_time')
const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const deletingDocument = ref(null)
const isDeleting = ref(false)
const docListPanel = ref<HTMLElement>()
const resizeHandle = ref<HTMLElement>()

// Computed properties
const documentList = computed(() => knowledgeBaseDetailStore.documentDetailList)
const activeDocument = computed(() => knowledgeBaseDetailStore.activeDocumentDetail)
const isLoading = computed(() => knowledgeBaseDetailStore.isLoading)

const filteredDocuments = computed(() => {
  let filtered = [...documentList.value]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc => 
      doc.document_name.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.document_name.localeCompare(b.document_name)
      case 'size':
        // Simple size comparison (would need proper parsing for accurate sorting)
        return (a.file_size || '').localeCompare(b.file_size || '')
      case 'upload_time':
      default:
        return new Date(b.upload_time || 0).getTime() - new Date(a.upload_time || 0).getTime()
    }
  })

  return filtered
})

// Event handlers
const handleSortChange = () => {
  // Sorting is reactive, no additional action needed
}

const handleDocumentClick = (doc: any) => {
  knowledgeBaseDetailStore.setActiveDocumentDetail(doc)
}

const handlePreview = (doc: any) => {
  knowledgeBaseDetailStore.setActiveDocumentDetail(doc)
}

const handleDownload = (doc: any) => {
  if (doc.pdf_file_path) {
    window.open(doc.pdf_file_path, '_blank')
  } else {
    message.error('文档下载链接不可用')
  }
}

const handleDelete = (doc: any) => {
  deletingDocument.value = doc
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!deletingDocument.value) return

  isDeleting.value = true
  
  try {
    await knowledgeBaseDetailStore.deleteDocument(deletingDocument.value.document_id)
    message.success('文档删除成功')
    showDeleteModal.value = false
  } catch (error) {
    console.error('删除文档失败:', error)
    message.error('删除文档失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

const handleDocumentsUploaded = () => {
  showUploadModal.value = false
  // Refresh document list
  knowledgeBaseDetailStore.fetchKnowledgeBaseDetail(props.knowledgeBase.id)
}

const handlePreviewError = (error: string) => {
  message.error(`文档预览失败: ${error}`)
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return 'description'
  
  const type = fileType.toLowerCase()
  if (type.includes('pdf')) return 'picture_as_pdf'
  if (type.includes('doc') || type.includes('word')) return 'description'
  if (type.includes('txt')) return 'text_snippet'
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return 'image'
  return 'description'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '未知时间'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Resize functionality
const initResize = () => {
  if (!resizeHandle.value || !docListPanel.value) return

  let isResizing = false
  let startX = 0
  let startWidth = 0

  const handleMouseDown = (e: MouseEvent) => {
    isResizing = true
    startX = e.clientX
    startWidth = docListPanel.value!.offsetWidth
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const deltaX = e.clientX - startX
    const newWidth = Math.max(300, Math.min(600, startWidth + deltaX))
    docListPanel.value!.style.width = `${newWidth}px`
  }

  const handleMouseUp = () => {
    isResizing = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  resizeHandle.value.addEventListener('mousedown', handleMouseDown)
}

// Lifecycle
onMounted(() => {
  // Load documents for the knowledge base
  knowledgeBaseDetailStore.fetchKnowledgeBaseDetail(props.knowledgeBase.id)
  
  // Initialize resize functionality
  initResize()
})

onUnmounted(() => {
  // Clean up event listeners if needed
})
</script>

<style scoped>
.document-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.doc-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.doc-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.upload-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  transition: all 0.3s ease;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.doc-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.doc-list-panel {
  width: 400px;
  min-width: 300px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  background: #fafafa;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.doc-count {
  color: #64748b;
  font-size: 14px;
}

.doc-controls {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.doc-search {
  flex: 1;
}

.doc-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid transparent;
}

.doc-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.doc-item-active {
  background: #ede9fe;
  border-color: #8b5cf6;
}

.doc-item-icon {
  margin-right: 12px;
  color: #7c3aed;
  font-size: 20px;
}

.doc-item-content {
  flex: 1;
  min-width: 0;
}

.doc-item-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-item-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.doc-item-meta span {
  white-space: nowrap;
}

.resize-handle {
  width: 4px;
  background: #e2e8f0;
  cursor: col-resize;
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background: #7c3aed;
}

.doc-preview-panel {
  flex: 1;
  overflow: hidden;
}

.menu-icon {
  font-size: 16px;
  margin-right: 8px;
  vertical-align: middle;
}

.delete-item {
  color: #dc2626;
}

.delete-modal-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.warning-icon {
  color: #f59e0b;
  font-size: 24px;
  margin-top: 4px;
}

.warning-text p {
  margin: 0 0 8px 0;
  color: #64748b;
  line-height: 1.6;
}

.warning-text strong {
  color: #1e293b;
  font-weight: 600;
}

.warning-note {
  color: #dc2626;
  font-size: 14px;
}
</style>
