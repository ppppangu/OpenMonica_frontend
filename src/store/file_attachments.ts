import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'
import { createAuthFormData } from '../utils/api'

// File attachment interface
export interface FileAttachment {
  file_id: string
  filename: string
  object_path: string
  public_url: string
  file_size: number
  file_type: 'image' | 'other'
  upload_status: 'uploading' | 'done' | 'error'
  upload_progress?: number
  error_message?: string
}

// API response interface - matches server.js response format
interface FileUploadResponse {
  file_id: string
  filename: string
  object_path: string
  public_url: string
  file_size: number
}

export const useFileAttachmentsStore = defineStore('file_attachments', () => {
  // Store arrays for different file types - simplified to only image_urls and file_urls
  const image_urls = ref<string[]>([])
  const file_urls = ref<string[]>([])

  // Store detailed file information
  const attachments = ref<FileAttachment[]>([])

  // File type categorization - simplified to image vs non-image
  const getFileType = (filename: string): 'image' | 'other' => {
    const extension = filename.toLowerCase().split('.').pop() || ''

    // Image extensions - all image files go to image_urls
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif']

    if (imageExtensions.includes(extension)) {
      return 'image'
    } else {
      // ALL non-image files go to file_urls (no distinction between documents and other files)
      return 'other'
    }
  }

  // Add file to appropriate array based on type
  const addFileToStore = (attachment: FileAttachment) => {
    // Add to detailed attachments list
    attachments.value.push(attachment)

    // Add URL to appropriate category array - simplified categorization
    switch (attachment.file_type) {
      case 'image':
        image_urls.value.push(attachment.public_url)
        break
      case 'other':
        file_urls.value.push(attachment.public_url)
        break
    }
  }

  // Remove file from store
  const removeFileFromStore = (fileId: string) => {
    const attachmentIndex = attachments.value.findIndex(att => att.file_id === fileId)
    if (attachmentIndex === -1) return

    const attachment = attachments.value[attachmentIndex]

    // Remove from appropriate URL array - simplified categorization
    switch (attachment.file_type) {
      case 'image':
        const imageIndex = image_urls.value.indexOf(attachment.public_url)
        if (imageIndex > -1) image_urls.value.splice(imageIndex, 1)
        break
      case 'other':
        const fileIndex = file_urls.value.indexOf(attachment.public_url)
        if (fileIndex > -1) file_urls.value.splice(fileIndex, 1)
        break
    }

    // Remove from detailed attachments
    attachments.value.splice(attachmentIndex, 1)
  }

  // Upload file to server
  const uploadFile = async (file: File): Promise<FileAttachment> => {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    const token = userStore.user?.token

    if (!userId) {
      throw new Error('User not authenticated')
    }

    if (!token) {
      throw new Error('Authentication token not found')
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
      // Prepare form data - matching server.js expected format (field name should be 'upload')
      const formData = createAuthFormData({
        user_id: userId
      })
      formData.append('upload', file)  // server.js expects 'upload' field name

      console.log('Uploading file:', {
        filename: file.name,
        size: file.size,
        type: file.type,
        user_id: userId
      })

      // Upload file to the existing server.js endpoint
      const response = await fetch('/user/file/upload_file', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      // Parse response - server.js returns data directly, not wrapped in status/message
      const result: FileUploadResponse = await response.json()

      console.log('File upload response:', result)

      // Validate response has required fields
      if (!result.public_url || !result.file_id) {
        throw new Error('Invalid response from server: missing public_url or file_id')
      }

      // Update attachment with server response
      const finalAttachment: FileAttachment = {
        file_id: result.file_id,
        filename: result.filename,
        object_path: result.object_path,
        public_url: result.public_url,
        file_size: result.file_size,
        file_type: getFileType(result.filename),
        upload_status: 'done'
      }

      // Remove temporary attachment and add final one
      removeFileFromStore(tempAttachment.file_id)
      addFileToStore(finalAttachment)

      console.log('File uploaded successfully:', {
        file_id: finalAttachment.file_id,
        public_url: finalAttachment.public_url,
        filename: finalAttachment.filename
      })

      return finalAttachment

    } catch (error) {
      console.error('File upload error:', error)

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
    image_urls.value = []
    file_urls.value = []
    attachments.value = []
  }

  // Get all successfully uploaded file URLs
  const getAllUploadedUrls = () => {
    return attachments.value
      .filter(att => att.upload_status === 'done')
      .map(att => att.public_url)
  }

  // Get upload status summary
  const getUploadStatus = () => {
    const total = attachments.value.length
    const uploading = attachments.value.filter(att => att.upload_status === 'uploading').length
    const done = attachments.value.filter(att => att.upload_status === 'done').length
    const error = attachments.value.filter(att => att.upload_status === 'error').length

    return {
      total,
      uploading,
      done,
      error,
      hasUploading: uploading > 0,
      hasErrors: error > 0,
      allDone: total > 0 && done === total
    }
  }

  return {
    // State - simplified to only image_urls and file_urls
    image_urls,
    file_urls,
    attachments,

    // Actions
    addFileToStore,
    removeFileFromStore,
    uploadFile,
    clearAllAttachments,
    getFileType,
    getAllUploadedUrls,
    getUploadStatus
  }
})
