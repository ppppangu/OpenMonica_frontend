<template>
  <div class="knowledge-base-preview">
    <!-- Header Section -->
    <div class="preview-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-title-section">
            <h1 class="header-title">{{ knowledgeBaseName }}</h1>
            <p class="header-subtitle">
              {{ knowledgeBaseDescription }} • {{ documentCount }}个文档
            </p>
          </div>
        </div>
        <div class="header-actions">
          <a-button
            type="default"
            @click="handleUpload"
            class="header-action-btn"
          >
            <template #icon>
              <span class="material-icons">upload</span>
            </template>
            上传文档
          </a-button>
          <a-button
            type="primary"
            @click="handleCreateNew"
            class="header-action-btn"
          >
            <template #icon>
              <span class="material-icons">add</span>
            </template>
            新建文档
          </a-button>
        </div>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="preview-main-layout">
      <!-- Left Side: Document List -->
      <div class="document-list-container" ref="fileListContainer">
        <DocumentList />
      </div>

      <!-- Resize Handle -->
      <div class="resize-handle" ref="resizeHandle"></div>

      <!-- Right Side: Document Preview -->
      <div class="document-preview-container">
        <DocumentPreview />
      </div>
    </div>

    <!-- Upload Modal -->
    <DocumentUploadModal 
      v-model:visible="showUploadModal"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useKnowledgeBaseStore } from '../../store/knowledgebase_list'
import { useKnowledgeBaseDetailStore } from '../../store/knowledgebase_detail'
import DocumentList from './DocumentList.vue'
import DocumentPreview from './DocumentPreview.vue'
import DocumentUploadModal from './DocumentUploadModal.vue'

defineOptions({ name: 'KnowledgeBasePreview' })

// Props
interface Props {
  knowledgeBase?: any
}

const props = defineProps<Props>()

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()

// Refs
const showUploadModal = ref(false)
const fileListContainer = ref<HTMLElement>()
const resizeHandle = ref<HTMLElement>()

// Computed properties
const knowledgeBaseName = computed(
  () => props.knowledgeBase?.name || knowledgeBaseStore.activeKnowledgeBaseItem?.name || "知识库预览"
)

const knowledgeBaseDescription = computed(
  () => props.knowledgeBase?.description || knowledgeBaseStore.activeKnowledgeBaseItem?.description || "暂无描述"
)

const documentCount = computed(
  () => knowledgeBaseDetailStore.documentDetailList.length
)

// Event handlers
const handleUpload = () => {
  console.log('Upload document clicked')
  showUploadModal.value = true
}

const handleCreateNew = () => {
  console.log('Create new document clicked')
  // TODO: 实现新建文档功能
}

const handleUploadSuccess = () => {
  console.log('Document uploaded successfully')
  // 弹窗组件内部已经处理了刷新知识库详情的逻辑
}

// Resize functionality
let isResizing = false

const handleMouseDown = () => {
  isResizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing || !fileListContainer.value) return

  const containerRect = fileListContainer.value.parentElement?.getBoundingClientRect()
  if (!containerRect) return

  const newWidth = e.clientX - containerRect.left
  const minWidth = 300
  const maxWidth = containerRect.width - 400

  if (newWidth >= minWidth && newWidth <= maxWidth) {
    fileListContainer.value.style.width = `${newWidth}px`
  }
}

const handleMouseUp = () => {
  isResizing = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Lifecycle
onMounted(() => {
  if (resizeHandle.value) {
    resizeHandle.value.addEventListener('mousedown', handleMouseDown)
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // Load knowledge base details if available
  const knowledgeBaseId = props.knowledgeBase?.id || knowledgeBaseStore.activeKnowledgeBaseItem?.id
  if (knowledgeBaseId) {
    knowledgeBaseDetailStore.fetchKnowledgeBaseDetail(knowledgeBaseId)
  }
})

onUnmounted(() => {
  if (resizeHandle.value) {
    resizeHandle.value.removeEventListener('mousedown', handleMouseDown)
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.knowledge-base-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.preview-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.header-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-action-btn {
  border-radius: 8px;
  height: 36px;
  padding: 0 16px;
  font-weight: 500;
}

.preview-main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.document-list-container {
  width: 400px;
  min-width: 300px;
  background: white;
  border-right: 1px solid #e2e8f0;
  overflow: hidden;
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

.document-preview-container {
  flex: 1;
  background: white;
  overflow: hidden;
}
</style>
