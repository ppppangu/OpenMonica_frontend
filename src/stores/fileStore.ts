import { create } from 'zustand'

export interface FileAttachment {
  id: string
  filename: string
  public_url: string
  file_type: string
  file_size: number
  upload_time: string
  category: 'image' | 'document' | 'other'
}

interface FileState {
  // File attachments
  imageUrls: string[]
  fileUrls: string[]
  attachments: FileAttachment[]
  
  // Upload state
  isUploading: boolean
  uploadProgress: Record<string, number>
  uploadErrors: Record<string, string>
  
  // Actions
  addImageUrl: (url: string) => void
  addFileUrl: (url: string) => void
  removeImageUrl: (url: string) => void
  removeFileUrl: (url: string) => void
  clearAllFiles: () => void
  
  // Attachment management
  addAttachment: (attachment: FileAttachment) => void
  removeAttachment: (id: string) => void
  updateAttachment: (id: string, updates: Partial<FileAttachment>) => void
  
  // Upload state management
  setUploading: (uploading: boolean) => void
  setUploadProgress: (fileId: string, progress: number) => void
  setUploadError: (fileId: string, error: string) => void
  clearUploadState: (fileId: string) => void
  
  // Utility functions
  categorizeFile: (filename: string) => 'image' | 'document' | 'other'
  getFilesByCategory: (category: 'image' | 'document' | 'other') => FileAttachment[]
}

export const useFileStore = create<FileState>((set, get) => ({
  imageUrls: [],
  fileUrls: [],
  attachments: [],
  isUploading: false,
  uploadProgress: {},
  uploadErrors: {},

  addImageUrl: (url: string) => {
    set(state => ({
      imageUrls: [...state.imageUrls, url]
    }))
  },

  addFileUrl: (url: string) => {
    set(state => ({
      fileUrls: [...state.fileUrls, url]
    }))
  },

  removeImageUrl: (url: string) => {
    set(state => ({
      imageUrls: state.imageUrls.filter(u => u !== url)
    }))
  },

  removeFileUrl: (url: string) => {
    set(state => ({
      fileUrls: state.fileUrls.filter(u => u !== url)
    }))
  },

  clearAllFiles: () => {
    set({
      imageUrls: [],
      fileUrls: [],
      attachments: []
    })
  },

  addAttachment: (attachment: FileAttachment) => {
    set(state => ({
      attachments: [...state.attachments, attachment]
    }))
    
    // Also add to appropriate URL array for backward compatibility
    const { categorizeFile, addImageUrl, addFileUrl } = get()
    const category = categorizeFile(attachment.filename)
    
    if (category === 'image') {
      addImageUrl(attachment.public_url)
    } else {
      addFileUrl(attachment.public_url)
    }
  },

  removeAttachment: (id: string) => {
    const { attachments } = get()
    const attachment = attachments.find(a => a.id === id)
    
    if (attachment) {
      // Remove from URL arrays
      const { removeImageUrl, removeFileUrl, categorizeFile } = get()
      const category = categorizeFile(attachment.filename)
      
      if (category === 'image') {
        removeImageUrl(attachment.public_url)
      } else {
        removeFileUrl(attachment.public_url)
      }
    }
    
    set(state => ({
      attachments: state.attachments.filter(a => a.id !== id)
    }))
  },

  updateAttachment: (id: string, updates: Partial<FileAttachment>) => {
    set(state => ({
      attachments: state.attachments.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    }))
  },

  setUploading: (uploading: boolean) => {
    set({ isUploading: uploading })
  },

  setUploadProgress: (fileId: string, progress: number) => {
    set(state => ({
      uploadProgress: { ...state.uploadProgress, [fileId]: progress }
    }))
  },

  setUploadError: (fileId: string, error: string) => {
    set(state => ({
      uploadErrors: { ...state.uploadErrors, [fileId]: error }
    }))
  },

  clearUploadState: (fileId: string) => {
    set(state => {
      const { [fileId]: removedProgress, ...restProgress } = state.uploadProgress
      const { [fileId]: removedError, ...restErrors } = state.uploadErrors
      return {
        uploadProgress: restProgress,
        uploadErrors: restErrors
      }
    })
  },

  categorizeFile: (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop() || ''
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf']
    
    if (imageExtensions.includes(extension)) {
      return 'image'
    } else if (documentExtensions.includes(extension)) {
      return 'document'
    } else {
      return 'other'
    }
  },

  getFilesByCategory: (category: 'image' | 'document' | 'other') => {
    const { attachments } = get()
    return attachments.filter(attachment => {
      const { categorizeFile } = get()
      return categorizeFile(attachment.filename) === category
    })
  }
}))
