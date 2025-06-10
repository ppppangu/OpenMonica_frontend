import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

// File attachment interface
export interface FileAttachment {
  file_id: string
  filename: string
  object_path: string
  public_url: string
  file_size: number
  file_type: 'image' | 'document' | 'other'
  upload_status: 'uploading' | 'done' | 'error'
  upload_progress?: number
  error_message?: string
}

// API response interface
interface FileUploadResponse {
  status: string
  message: string
  data: {
    file_id: string
    filename: string
    object_path: string
    public_url: string
    file_size: number
  }
}

export const useFileAttachmentsStore = defineStore('file_attachments', () => {
  // Store arrays for different file types
  const images_url = ref<string[]>([])
  const documents_url = ref<string[]>([])
  const files_url = ref<string[]>([])
  
  // Store detailed file information
  const attachments = ref<FileAttachment[]>([])

  // File type categorization
  const getFileType = (filename: string): 'image' | 'document' | 'other' => {
    const extension = filename.toLowerCase().split('.').pop() || ''
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx']
    
    if (imageExtensions.includes(extension)) {
      return 'image'
    } else if (documentExtensions.includes(extension)) {
      return 'document'
    } else {
      return 'other'
    }
  }

  // Add file to appropriate array based on type
  const addFileToStore = (attachment: FileAttachment) => {
    // Add to detailed attachments list
    attachments.value.push(attachment)
    
    // Add URL to appropriate category array
    switch (attachment.file_type) {
      case 'image':
        images_url.value.push(attachment.public_url)
        break
      case 'document':
        documents_url.value.push(attachment.public_url)
        break
      case 'other':
        files_url.value.push(attachment.public_url)
        break
    }
  }

  // Remove file from store
  const removeFileFromStore = (fileId: string) => {
    const attachmentIndex = attachments.value.findIndex(att => att.file_id === fileId)
    if (attachmentIndex === -1) return

    const attachment = attachments.value[attachmentIndex]
    
    // Remove from appropriate URL array
    switch (attachment.file_type) {
      case 'image':
        const imageIndex = images_url.value.indexOf(attachment.public_url)
        if (imageIndex > -1) images_url.value.splice(imageIndex, 1)
        break
      case 'document':
        const docIndex = documents_url.value.indexOf(attachment.public_url)
        if (docIndex > -1) documents_url.value.splice(docIndex, 1)
        break
      case 'other':
        const fileIndex = files_url.value.indexOf(attachment.public_url)
        if (fileIndex > -1) files_url.value.splice(fileIndex, 1)
        break
    }
    
    // Remove from detailed attachments
    attachments.value.splice(attachmentIndex, 1)
  }

  // Upload file to server
  const uploadFile = async (file: File): Promise<FileAttachment> => {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Create temporary attachment for UI feedback
    const tempAttachment: FileAttachment = {
      file_id: `temp_${Date.now()}`,
      filename: file.name,
      object_path: '',
      public_url: '',
      file_size: file.size,
      file_type: getFileType(file.name),
      upload_status: 'uploading',
      upload_progress: 0
    }

    // Add to store immediately for UI feedback
    addFileToStore(tempAttachment)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', userId)

      // Upload file
      const response = await fetch('/user/file/upload_file', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result: FileUploadResponse = await response.json()

      if (result.status !== 'success') {
        throw new Error(result.message || 'Upload failed')
      }

      // Update attachment with server response
      const finalAttachment: FileAttachment = {
        file_id: result.data.file_id,
        filename: result.data.filename,
        object_path: result.data.object_path,
        public_url: result.data.public_url,
        file_size: result.data.file_size,
        file_type: getFileType(result.data.filename),
        upload_status: 'done'
      }

      // Remove temporary attachment and add final one
      removeFileFromStore(tempAttachment.file_id)
      addFileToStore(finalAttachment)

      return finalAttachment

    } catch (error) {
      // Update temporary attachment with error status
      const errorAttachment = { ...tempAttachment }
      errorAttachment.upload_status = 'error'
      errorAttachment.error_message = error instanceof Error ? error.message : 'Upload failed'
      
      // Remove temp and add error version
      removeFileFromStore(tempAttachment.file_id)
      addFileToStore(errorAttachment)
      
      throw error
    }
  }

  // Clear all attachments
  const clearAllAttachments = () => {
    images_url.value = []
    documents_url.value = []
    files_url.value = []
    attachments.value = []
  }

  return {
    // State
    images_url,
    documents_url,
    files_url,
    attachments,
    
    // Actions
    addFileToStore,
    removeFileFromStore,
    uploadFile,
    clearAllAttachments,
    getFileType
  }
})
