<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { Button, Upload, message, Tooltip, Badge } from 'ant-design-vue'
import { CloudUploadOutlined, FileOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { useFileAttachmentsStore } from '../../store/file_attachments'

defineOptions({ name: 'FileUploadWidget' })

const fileAttachmentsStore = useFileAttachmentsStore()

// Widget state
const isExpanded = ref(false)
const uploadRef = ref()

// Computed properties
const uploadStatus = computed(() => fileAttachmentsStore.getUploadStatus())
const hasFiles = computed(() => fileAttachmentsStore.attachments.length > 0)

// File upload handling
const handleFileSelect = (info: any) => {
  const { file } = info
  if (file.status !== 'uploading') {
    handleCustomRequest({ file })
  }
}

const handleCustomRequest = async (options: any) => {
  try {
    const result = await fileAttachmentsStore.uploadFile(options.file)
    message.success(`${options.file.name} uploaded successfully`)
  } catch (error) {
    console.error('File upload error:', error)
    message.error(`Failed to upload ${options.file.name}`)
  }
}

const handleFileRemove = (fileId: string) => {
  fileAttachmentsStore.removeFileFromStore(fileId)
  message.success('File removed')
}

const handleClearAll = () => {
  fileAttachmentsStore.clearAllAttachments()
  message.success('All files cleared')
}

// Toggle widget expansion
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Trigger file selection
const triggerFileSelect = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '*/*'
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files) {
      Array.from(files).forEach(file => {
        handleCustomRequest({ file })
      })
    }
  }
  input.click()
}

// Get file icon based on type
const getFileIcon = (filename: string) => {
  const ext = filename.toLowerCase().split('.').pop() || ''
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  
  if (imageExts.includes(ext)) {
    return '🖼️'
  } else if (['pdf'].includes(ext)) {
    return '📄'
  } else if (['doc', 'docx'].includes(ext)) {
    return '📝'
  } else if (['xls', 'xlsx'].includes(ext)) {
    return '📊'
  } else if (['ppt', 'pptx'].includes(ext)) {
    return '📈'
  } else {
    return '📎'
  }
}
</script>

<template>
  <div class="file-upload-widget">
    <!-- Main Upload Button -->
    <div class="upload-button-container">
      <Badge :count="uploadStatus.total" :offset="[-8, 8]" :show-zero="false">
        <Tooltip :title="hasFiles ? 'View uploaded files' : 'Upload files'">
          <Button
            type="primary"
            shape="circle"
            :icon="h(CloudUploadOutlined)"
            @click="hasFiles ? toggleExpanded() : triggerFileSelect()"
            class="main-upload-btn"
            :loading="uploadStatus.hasUploading"
          />
        </Tooltip>
      </Badge>
    </div>

    <!-- Expanded File List -->
    <div v-if="isExpanded && hasFiles" class="file-list-panel">
      <div class="file-list-header">
        <span class="file-count">{{ uploadStatus.total }} files</span>
        <div class="header-actions">
          <Tooltip title="Upload more files">
            <Button
              type="text"
              size="small"
              :icon="h(CloudUploadOutlined)"
              @click="triggerFileSelect()"
            />
          </Tooltip>
          <Tooltip title="Clear all files">
            <Button
              type="text"
              size="small"
              :icon="h(DeleteOutlined)"
              @click="handleClearAll"
              danger
            />
          </Tooltip>
        </div>
      </div>

      <div class="file-list">
        <div
          v-for="attachment in fileAttachmentsStore.attachments"
          :key="attachment.file_id"
          class="file-item"
          :class="{
            'uploading': attachment.upload_status === 'uploading',
            'error': attachment.upload_status === 'error'
          }"
        >
          <div class="file-info">
            <span class="file-icon">{{ getFileIcon(attachment.filename) }}</span>
            <div class="file-details">
              <div class="file-name" :title="attachment.filename">
                {{ attachment.filename }}
              </div>
              <div class="file-size">
                {{ (attachment.file_size / 1024).toFixed(1) }} KB
              </div>
            </div>
          </div>
          
          <div class="file-actions">
            <Tooltip v-if="attachment.upload_status === 'done'" title="View file">
              <Button
                type="text"
                size="small"
                :icon="h(EyeOutlined)"
                @click="window.open(attachment.public_url, '_blank')"
              />
            </Tooltip>
            <Tooltip title="Remove file">
              <Button
                type="text"
                size="small"
                :icon="h(DeleteOutlined)"
                @click="handleFileRemove(attachment.file_id)"
                danger
              />
            </Tooltip>
          </div>

          <!-- Upload Progress -->
          <div v-if="attachment.upload_status === 'uploading'" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: '50%' }"></div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="attachment.upload_status === 'error'" class="error-message">
            {{ attachment.error_message || 'Upload failed' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Upload Area (when no files) -->
    <div v-if="!hasFiles" class="quick-upload-hint">
      <Tooltip title="Click to upload files">
        <div class="upload-hint" @click="triggerFileSelect()">
          📎 Upload
        </div>
      </Tooltip>
    </div>
  </div>
</template>

<style scoped>
.file-upload-widget {
  position: relative;
  z-index: 100;
}

.upload-button-container {
  position: relative;
}

.main-upload-btn {
  width: 40px !important;
  height: 40px !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3) !important;
  transition: all 0.3s ease !important;
}

.main-upload-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4) !important;
}

.file-list-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 320px;
  max-height: 400px;
  background: white;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}

.file-count {
  font-size: 14px;
  font-weight: 500;
  color: #7c3aed;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.file-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #f3f4f6;
  border-color: rgba(124, 58, 237, 0.2);
}

.file-item.uploading {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-item.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #6b7280;
}

.file-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.upload-progress {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
}

.error-message {
  margin-top: 4px;
  font-size: 11px;
  color: #ef4444;
}

.quick-upload-hint {
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.upload-hint {
  font-size: 12px;
  color: #7c3aed;
  cursor: pointer;
  white-space: nowrap;
}

.upload-hint:hover {
  color: #6d28d9;
}

/* Scrollbar styling */
.file-list::-webkit-scrollbar {
  width: 4px;
}

.file-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.file-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.file-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
