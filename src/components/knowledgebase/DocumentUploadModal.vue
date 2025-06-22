<template>
  <a-modal
    v-model:open="visible"
    title="上传文档"
    :confirm-loading="isUploading"
    @ok="handleUpload"
    @cancel="handleCancel"
    ok-text="开始上传"
    cancel-text="取消"
    width="700px"
    class="upload-modal"
    :ok-button-props="{ disabled: selectedFiles.length === 0 }"
  >
    <div class="modal-content">
      <!-- Upload Area -->
      <div 
        class="upload-area" 
        :class="{ 'upload-area-dragover': isDragOver }"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @click="triggerFileSelect"
      >
        <div class="upload-icon">
          <span class="material-icons">cloud_upload</span>
        </div>
        <div class="upload-text">
          <h3>拖拽文件到此处或点击选择</h3>
          <p>支持 PDF、DOC、DOCX、TXT 等格式，单个文件最大 50MB</p>
        </div>
        <a-button type="primary" size="large" class="select-btn">
          选择文件
        </a-button>
      </div>

      <!-- Hidden File Input -->
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md"
        @change="handleFileSelect"
        style="display: none"
      />

      <!-- Processing Mode Selection -->
      <div class="processing-mode" v-if="selectedFiles.length > 0">
        <h4>处理模式</h4>
        <a-radio-group v-model:value="processingMode" class="mode-group">
          <a-radio value="simple" class="mode-option">
            <div class="mode-content">
              <div class="mode-title">普通模式</div>
              <div class="mode-description">快速处理，适合一般文档</div>
            </div>
          </a-radio>
          <a-radio value="normal" class="mode-option">
            <div class="mode-content">
              <div class="mode-title">强劲模式</div>
              <div class="mode-description">深度分析，提取更多信息</div>
            </div>
          </a-radio>
        </a-radio-group>
      </div>

      <!-- Selected Files List -->
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <h4>已选择文件 ({{ selectedFiles.length }})</h4>
        <div class="file-list">
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="file-item"
          >
            <div class="file-icon">
              <span class="material-icons">{{ getFileIcon(file.type) }}</span>
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                {{ formatFileSize(file.size) }} • {{ getFileType(file.type) }}
              </div>
            </div>
            <div class="file-status">
              <span v-if="uploadProgress[index] !== undefined" class="progress-text">
                {{ uploadProgress[index] }}%
              </span>
              <a-progress
                v-if="uploadProgress[index] !== undefined"
                :percent="uploadProgress[index]"
                :show-info="false"
                size="small"
                stroke-color="#7c3aed"
              />
            </div>
            <div class="file-actions">
              <a-button
                type="text"
                size="small"
                @click="removeFile(index)"
                :disabled="isUploading"
              >
                <span class="material-icons">close</span>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Progress Summary -->
      <div v-if="isUploading" class="upload-summary">
        <div class="summary-header">
          <h4>上传进度</h4>
          <span class="summary-stats">
            {{ completedUploads }}/{{ selectedFiles.length }} 完成
          </span>
        </div>
        <a-progress
          :percent="overallProgress"
          stroke-color="#7c3aed"
          :show-info="true"
        />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '../../store/user_info'
import { authenticatedFormPost } from '../../utils/api'

defineOptions({ name: 'DocumentUploadModal' })

// Props
const props = defineProps<{
  visible: boolean
  knowledgeBase: {
    id: string
    name: string
  }
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'documents-uploaded': []
}>()

// Store
const userStore = useUserStore()

// Refs
const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const isDragOver = ref(false)
const isUploading = ref(false)
const processingMode = ref('simple')
const uploadProgress = reactive<Record<number, number>>({})
const completedUploads = ref(0)

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const overallProgress = computed(() => {
  if (selectedFiles.value.length === 0) return 0
  
  const totalProgress = Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0)
  return Math.round(totalProgress / selectedFiles.value.length)
})

// Methods
const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const addFiles = (files: File[]) => {
  const validFiles = files.filter(file => {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      message.error(`文件 ${file.name} 超过 50MB 限制`)
      return false
    }
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|md)$/i)) {
      message.error(`文件 ${file.name} 格式不支持`)
      return false
    }
    
    return true
  })
  
  selectedFiles.value.push(...validFiles)
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
  delete uploadProgress[index]
}

const handleUpload = async () => {
  if (selectedFiles.value.length === 0) {
    message.error('请选择要上传的文件')
    return
  }
  
  isUploading.value = true
  completedUploads.value = 0
  
  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      await uploadSingleFile(selectedFiles.value[i], i)
      completedUploads.value++
    }
    
    message.success(`成功上传 ${selectedFiles.value.length} 个文件`)
    emit('documents-uploaded')
    resetModal()
    
  } catch (error) {
    console.error('上传失败:', error)
    message.error('部分文件上传失败，请重试')
  } finally {
    isUploading.value = false
  }
}

const uploadSingleFile = async (file: File, index: number) => {
  uploadProgress[index] = 0
  
  try {
    // First upload file to get public URL
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userStore.user?.id || '')
    formData.append('token', userStore.user?.token || '')
    
    const uploadResponse = await fetch('/user/file/upload_file', {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error('文件上传失败')
    }
    
    const uploadResult = await uploadResponse.json()
    uploadProgress[index] = 50
    
    // Then process file in knowledge base
    const processData = new FormData()
    processData.append('user_id', userStore.user?.id || '')
    processData.append('file_url', uploadResult.public_url)
    processData.append('knowledge_base_id', props.knowledgeBase.id)
    processData.append('mode', processingMode.value)
    processData.append('token', userStore.user?.token || '')
    
    const processResponse = await authenticatedFormPost('/process', processData)
    
    if (!processResponse.ok) {
      throw new Error('文档处理失败')
    }
    
    uploadProgress[index] = 100
    
  } catch (error) {
    console.error(`文件 ${file.name} 上传失败:`, error)
    uploadProgress[index] = 0
    throw error
  }
}

const handleCancel = () => {
  if (isUploading.value) {
    message.warning('上传进行中，请等待完成')
    return
  }
  
  resetModal()
  emit('update:visible', false)
}

const resetModal = () => {
  selectedFiles.value = []
  Object.keys(uploadProgress).forEach(key => delete uploadProgress[parseInt(key)])
  completedUploads.value = 0
  processingMode.value = 'simple'
  isDragOver.value = false
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return 'picture_as_pdf'
  if (type.includes('word') || type.includes('document')) return 'description'
  if (type.includes('text')) return 'text_snippet'
  return 'description'
}

const getFileType = (type: string) => {
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('word')) return 'Word'
  if (type.includes('document')) return 'Word'
  if (type.includes('text')) return 'Text'
  if (type.includes('markdown')) return 'Markdown'
  return '未知'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Watch for modal visibility changes
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    resetModal()
  }
})
</script>

<style scoped>
.upload-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.upload-modal :deep(.ant-modal-title) {
  color: #1e293b;
  font-weight: 600;
}

.modal-content {
  padding: 8px 0;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  margin-bottom: 24px;
}

.upload-area:hover,
.upload-area-dragover {
  border-color: #7c3aed;
  background: #f8fafc;
}

.upload-icon {
  font-size: 48px;
  color: #7c3aed;
  margin-bottom: 16px;
}

.upload-text h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.upload-text p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 14px;
}

.select-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 24px;
  font-weight: 500;
}

.processing-mode {
  margin-bottom: 24px;
}

.processing-mode h4 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.mode-group {
  display: flex;
  gap: 16px;
}

.mode-option {
  flex: 1;
  margin: 0;
}

.mode-option :deep(.ant-radio-wrapper) {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mode-option :deep(.ant-radio-wrapper:hover) {
  border-color: #7c3aed;
}

.mode-option :deep(.ant-radio-wrapper-checked) {
  border-color: #7c3aed;
  background: #f8fafc;
}

.mode-content {
  margin-left: 8px;
}

.mode-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.mode-description {
  font-size: 12px;
  color: #64748b;
}

.selected-files h4 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  background: white;
}

.file-icon {
  margin-right: 12px;
  color: #7c3aed;
  font-size: 20px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.file-meta {
  font-size: 12px;
  color: #64748b;
}

.file-status {
  margin: 0 12px;
  min-width: 80px;
  text-align: right;
}

.progress-text {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 500;
}

.upload-summary {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-header h4 {
  margin: 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.summary-stats {
  font-size: 14px;
  color: #7c3aed;
  font-weight: 500;
}
</style>
