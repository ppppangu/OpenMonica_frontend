<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">上传文档到知识库</h3>
        <button class="modal-close-btn" @click="handleClose">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="modal-body">
        <!-- 文件选择区域 -->
        <div class="upload-section">
          <div class="upload-area" :class="{ 'upload-area-dragover': isDragOver }" 
               @drop="handleDrop" 
               @dragover="handleDragOver" 
               @dragleave="handleDragLeave"
               @click="triggerFileSelect">
            <div class="upload-icon">
              <span class="material-icons">cloud_upload</span>
            </div>
            <div class="upload-text">
              <p class="upload-primary">点击选择文件或拖拽文件到此处</p>
              <p class="upload-secondary">支持 PDF、DOC、DOCX、TXT、MD 等格式</p>
            </div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            style="display: none" 
            @change="handleFileSelect"
            accept=".pdf,.doc,.docx,.txt,.md"
          />
        </div>

        <!-- 已选择的文件 -->
        <div v-if="selectedFile" class="selected-file">
          <div class="file-info">
            <span class="material-icons">description</span>
            <div class="file-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            </div>
            <button class="file-remove-btn" @click="removeFile">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>

        <!-- 处理模式选择 -->
        <div class="mode-section">
          <label class="mode-label">处理模式：</label>
          <div class="mode-options">
            <label class="mode-option">
              <input type="radio" v-model="selectedMode" value="simple" />
              <span class="mode-text">普通模式</span>
            </label>
            <label class="mode-option">
              <input type="radio" v-model="selectedMode" value="normal" />
              <span class="mode-text">强劲模式</span>
            </label>
          </div>
        </div>

        <!-- 上传进度 -->
        <div v-if="uploadProgress.show" class="upload-progress">
          <div class="progress-info">
            <span>{{ uploadProgress.message }}</span>
            <span v-if="uploadProgress.percent >= 0">{{ uploadProgress.percent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress.percent + '%' }"></div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="error-message">
          <span class="material-icons">error</span>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose" :disabled="isUploading">
          取消
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleUpload" 
          :disabled="!selectedFile || isUploading"
        >
          <span v-if="isUploading" class="material-icons spinning">refresh</span>
          {{ isUploading ? '上传中...' : '确定上传' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../store/user_info'
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useKnowledgeBaseDetailStore } from '../store/knowledgebase_detail'
import { createAuthFormData } from '../utils/api'

defineOptions({ name: 'DocumentUploadModal' })

// Props
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  uploaded: []
}>()

// Stores
const userStore = useUserStore()
const knowledgeBaseStore = useKnowledgeBaseStore()
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()

// Refs
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const selectedMode = ref<'simple' | 'normal'>('simple')
const isDragOver = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')

const uploadProgress = ref({
  show: false,
  message: '',
  percent: 0
})

// Computed
const knowledgeBaseId = computed(() => knowledgeBaseStore.activeKnowledgeBaseItem?.id)

// Methods
const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
    errorMessage.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    errorMessage.value = ''
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleOverlayClick = () => {
  if (!isUploading.value) {
    handleClose()
  }
}

const handleClose = () => {
  if (!isUploading.value) {
    selectedFile.value = null
    selectedMode.value = 'simple'
    errorMessage.value = ''
    uploadProgress.value.show = false
    emit('close')
  }
}

const handleUpload = async () => {
  if (!selectedFile.value || !knowledgeBaseId.value) {
    errorMessage.value = '请选择文件和确保知识库已选择'
    return
  }

  const userId = userStore.user?.id
  if (!userId) {
    errorMessage.value = '用户未登录'
    return
  }

  isUploading.value = true
  errorMessage.value = ''
  
  try {
    // 第一步：上传文件获取URL
    uploadProgress.value = {
      show: true,
      message: '正在上传文件...',
      percent: 0
    }

    const formData = createAuthFormData({
      user_id: userId
    })
    formData.append('upload', selectedFile.value)

    const uploadResponse = await fetch('/user/file/upload_file', {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error(`文件上传失败: ${uploadResponse.status}`)
    }

    const uploadResult = await uploadResponse.json()
    const fileUrl = uploadResult.public_url

    if (!fileUrl) {
      throw new Error('文件上传成功但未获取到文件URL')
    }

    uploadProgress.value = {
      show: true,
      message: '正在处理文档...',
      percent: 50
    }

    // 第二步：将文件添加到知识库
    const processFormData = createAuthFormData({
      user_id: userId,
      file_url: fileUrl,
      knowledge_base_id: knowledgeBaseId.value,
      mode: selectedMode.value
    })

    const processResponse = await fetch('/process', {
      method: 'POST',
      body: processFormData
    })

    if (!processResponse.ok) {
      throw new Error(`文档处理失败: ${processResponse.status}`)
    }

    const processResult = await processResponse.json()
    
    uploadProgress.value = {
      show: true,
      message: '上传完成！',
      percent: 100
    }

    // 刷新知识库详情
    setTimeout(async () => {
      await knowledgeBaseDetailStore.fetchKnowledgeBaseDetail(knowledgeBaseId.value)
      emit('uploaded')
      handleClose()
    }, 1000)

  } catch (error) {
    console.error('文档上传失败:', error)
    errorMessage.value = error instanceof Error ? error.message : '上传失败，请稍后重试'
    uploadProgress.value.show = false
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.upload-section {
  margin-bottom: 1.5rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover,
.upload-area-dragover {
  border-color: #7c3aed;
  background: #faf5ff;
}

.upload-icon {
  margin-bottom: 1rem;
}

.upload-icon .material-icons {
  font-size: 3rem;
  color: #9ca3af;
}

.upload-primary {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  color: #374151;
}

.upload-secondary {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.selected-file {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-info .material-icons {
  color: #7c3aed;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.file-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-remove-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.mode-section {
  margin-bottom: 1.5rem;
}

.mode-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.mode-options {
  display: flex;
  gap: 1.5rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.mode-option input[type="radio"] {
  margin: 0;
}

.mode-text {
  color: #374151;
}

.upload-progress {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #7c3aed;
  transition: width 0.3s ease;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-primary {
  background: #7c3aed;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
