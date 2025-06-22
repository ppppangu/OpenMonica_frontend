<template>
  <div class="document-preview">
    <!-- Preview Header -->
    <div class="preview-header">
      <div class="preview-header-info">
        <h3 class="preview-title">
          {{ document ? document.document_name : '文档预览' }}
        </h3>
        <div v-if="document" class="preview-meta">
          <span class="meta-item">
            <span class="material-icons">schedule</span>
            {{ formatDate(document.upload_time) }}
          </span>
          <span class="meta-item">
            <span class="material-icons">description</span>
            {{ document.file_type || 'PDF' }}
          </span>
          <span class="meta-item">
            <span class="material-icons">storage</span>
            {{ document.file_size || '未知大小' }}
          </span>
        </div>
      </div>
      
      <div class="preview-actions" v-if="document">
        <a-button-group>
          <a-button @click="handleDownload" title="下载文档">
            <span class="material-icons">download</span>
          </a-button>
          <a-button @click="handleOpenInNewTab" title="在新标签页打开">
            <span class="material-icons">open_in_new</span>
          </a-button>
          <a-button @click="handleRefresh" title="刷新预览">
            <span class="material-icons">refresh</span>
          </a-button>
        </a-button-group>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="preview-content">
      <!-- No Document Selected -->
      <div v-if="!document" class="no-document">
        <div class="no-document-icon">
          <span class="material-icons">description</span>
        </div>
        <h4>选择文档进行预览</h4>
        <p>从左侧文档列表中选择一个文档来查看其内容</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="loading-state">
        <a-spin size="large" />
        <p class="loading-text">正在加载文档预览...</p>
        <div class="loading-progress">
          <a-progress 
            :percent="loadingProgress" 
            :show-info="false"
            stroke-color="#7c3aed"
          />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="previewError" class="error-state">
        <div class="error-icon">
          <span class="material-icons">error_outline</span>
        </div>
        <h4>预览失败</h4>
        <p class="error-message">{{ previewError }}</p>
        <div class="error-actions">
          <a-button type="primary" @click="handleRetry">
            重试预览
          </a-button>
          <a-button @click="handleDownload">
            直接下载
          </a-button>
        </div>
      </div>

      <!-- Document Preview -->
      <div v-else class="document-frame-container">
        <!-- PDF Preview -->
        <iframe
          v-if="previewUrl"
          ref="previewFrame"
          :src="previewUrl"
          class="document-frame"
          @load="handleFrameLoad"
          @error="handleFrameError"
        />
        
        <!-- Fallback for unsupported formats -->
        <div v-else class="unsupported-format">
          <div class="unsupported-icon">
            <span class="material-icons">description</span>
          </div>
          <h4>无法预览此文档格式</h4>
          <p>该文档格式不支持在线预览，请下载后查看</p>
          <a-button type="primary" @click="handleDownload">
            下载文档
          </a-button>
        </div>
      </div>
    </div>

    <!-- Preview Footer -->
    <div v-if="document && !isLoading && !previewError" class="preview-footer">
      <div class="footer-info">
        <span class="footer-text">
          文档路径: {{ getDisplayPath(document.pdf_file_path) }}
        </span>
      </div>
      <div class="footer-actions">
        <a-button size="small" @click="handleViewMarkdown" v-if="document.markdown_file_path">
          查看Markdown
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'

defineOptions({ name: 'DocumentPreview' })

// Props
const props = defineProps<{
  document: any
}>()

// Emits
const emit = defineEmits<{
  'document-load-error': [error: string]
}>()

// Reactive state
const previewFrame = ref<HTMLIFrameElement | null>(null)
const isLoading = ref(false)
const previewError = ref<string | null>(null)
const loadingProgress = ref(0)
const loadStartTime = ref<number>(0)

// Computed properties
const previewUrl = computed(() => {
  if (!props.document?.pdf_file_path) return null

  // Use proxy endpoint to avoid CORS issues
  const proxyUrl = new URL('/file/proxy', window.location.origin)
  proxyUrl.searchParams.set('url', props.document.pdf_file_path)
  proxyUrl.searchParams.set('t', Date.now().toString()) // Prevent caching

  return proxyUrl.toString()
})

// Methods
const handleDownload = () => {
  if (!props.document?.pdf_file_path) {
    message.error('下载链接不可用')
    return
  }
  
  try {
    const link = document.createElement('a')
    link.href = props.document.pdf_file_path
    link.download = props.document.document_name || 'document.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败，请稍后重试')
  }
}

const handleOpenInNewTab = () => {
  if (!props.document?.pdf_file_path) {
    message.error('文档链接不可用')
    return
  }
  
  window.open(props.document.pdf_file_path, '_blank')
}

const handleRefresh = () => {
  if (previewFrame.value) {
    loadDocument()
  }
}

const handleRetry = () => {
  previewError.value = null
  loadDocument()
}

const handleViewMarkdown = () => {
  if (!props.document?.markdown_file_path) {
    message.error('Markdown文件不可用')
    return
  }
  
  window.open(props.document.markdown_file_path, '_blank')
}

const handleFrameLoad = () => {
  isLoading.value = false
  loadingProgress.value = 100
  previewError.value = null
  
  const loadTime = Date.now() - loadStartTime.value
  console.log(`Document loaded in ${loadTime}ms`)
}

const handleFrameError = () => {
  isLoading.value = false
  const errorMsg = '文档加载失败，可能是网络问题或文档不存在'
  previewError.value = errorMsg
  emit('document-load-error', errorMsg)
}

const loadDocument = async () => {
  if (!props.document?.pdf_file_path) return

  isLoading.value = true
  previewError.value = null
  loadingProgress.value = 0
  loadStartTime.value = Date.now()

  // Simulate loading progress
  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.random() * 20
    }
  }, 200)

  try {
    // Test proxy endpoint accessibility first
    const proxyTestUrl = new URL('/file/proxy', window.location.origin)
    proxyTestUrl.searchParams.set('url', props.document.pdf_file_path)

    const response = await fetch(proxyTestUrl.toString(), {
      method: 'HEAD'
    })

    clearInterval(progressInterval)

    if (response.ok) {
      loadingProgress.value = 95

      // Load document through proxy
      await nextTick()
      if (previewFrame.value) {
        previewFrame.value.src = previewUrl.value || ''
      }
    } else {
      throw new Error(`Proxy response: ${response.status} ${response.statusText}`)
    }

  } catch (error) {
    clearInterval(progressInterval)
    console.warn('Proxy accessibility check failed, trying direct load:', error)

    // Fallback: try direct load
    try {
      await nextTick()
      if (previewFrame.value) {
        previewFrame.value.src = props.document.pdf_file_path
      }
      loadingProgress.value = 95
    } catch (directError) {
      console.error('Direct load also failed:', directError)
      isLoading.value = false
      previewError.value = '文档加载失败，可能是网络问题或文档不可访问'
      emit('document-load-error', previewError.value)
      return
    }
  }

  // Set a timeout for loading
  setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false
      previewError.value = '文档加载超时，请检查网络连接或稍后重试'
      emit('document-load-error', previewError.value)
    }
  }, 20000) // 20 second timeout for better user experience
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

const getDisplayPath = (path: string) => {
  if (!path) return '未知路径'
  
  try {
    const url = new URL(path)
    return url.pathname.split('/').slice(-3).join('/')
  } catch {
    return path.split('/').slice(-3).join('/')
  }
}

// Watch for document changes
watch(() => props.document, (newDocument) => {
  if (newDocument) {
    loadDocument()
  } else {
    isLoading.value = false
    previewError.value = null
    loadingProgress.value = 0
  }
}, { immediate: true })
</script>

<style scoped>
.document-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafafa;
}

.preview-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.preview-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.meta-item .material-icons {
  font-size: 14px;
}

.preview-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.no-document,
.loading-state,
.error-state,
.unsupported-format {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.no-document-icon,
.error-icon,
.unsupported-icon {
  font-size: 64px;
  color: #94a3b8;
  margin-bottom: 16px;
}

.no-document h4,
.error-state h4,
.unsupported-format h4 {
  margin: 0 0 8px 0;
  color: #475569;
  font-size: 18px;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
}

.loading-progress {
  width: 200px;
  margin-top: 16px;
}

.error-message {
  margin-bottom: 20px;
  color: #dc2626;
  font-size: 14px;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.document-frame-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.document-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}

.footer-text {
  font-size: 12px;
  color: #64748b;
  font-family: monospace;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

/* Button group styling */
.preview-actions :deep(.ant-btn-group) {
  display: flex;
}

.preview-actions :deep(.ant-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  height: 32px;
  border-radius: 6px;
}

.preview-actions :deep(.ant-btn .material-icons) {
  font-size: 16px;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-state .loading-text {
  animation: pulse 2s infinite;
}
</style>
