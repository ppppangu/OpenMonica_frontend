// File management API service
import { authenticatedFormPost } from './api'

export interface FileUploadResponse {
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

export interface FileProcessResponse {
  status: string
  message: string
  data: {
    user_id: string
    knowledge_base_id: string
    mode: string
    file_url: string
    markdown_public_url?: string
    pdf_file_public_url?: string
    file_uuid?: string
  }
}

export interface FileDeleteResponse {
  status: string
  message: string
  data?: any
}

/**
 * Upload file to MinIO storage
 */
export async function uploadFileToStorage(file: File, userId: string): Promise<FileUploadResponse> {
  const formData = new FormData()
  formData.append('upload', file)
  formData.append('user_id', userId)

  const response = await fetch('/user/file/upload_file', {
    method: 'POST',
    body: formData
  })
  const result = await response.json().catch(() => ({} as any))
  if (!response.ok) {
    throw new Error(result?.detail || result?.message || `Upload failed: ${response.status} ${response.statusText}`)
  }
  return result
}

/**
 * Process file and add to knowledge base
 */
export async function processFileToKnowledgeBase(
  userId: string,
  fileUrl: string,
  knowledgeBaseId: string,
  mode: 'simple' | 'normal' = 'simple'
): Promise<FileProcessResponse> {
  const response = await authenticatedFormPost('/process', {
    user_id: userId,
    file_url: fileUrl,
    knowledge_base_id: knowledgeBaseId,
    mode
  })
  const result = await response.json().catch(() => ({} as any))
  if (!response.ok) {
    throw new Error(result?.detail || result?.message || `Process failed: ${response.status} ${response.statusText}`)
  }
  return result
}

/**
 * Upload file directly to knowledge base (combines upload and process)
 */
export async function uploadFileToKnowledgeBase(
  file: File,
  userId: string,
  knowledgeBaseId: string,
  mode: 'simple' | 'normal' = 'simple'
): Promise<FileProcessResponse> {
  // First upload the file to get the public URL
  const uploadResult = await uploadFileToStorage(file, userId)
  
  if (uploadResult.status !== 'success') {
    throw new Error(`File upload failed: ${uploadResult.message}`)
  }

  // Then process the file and add to knowledge base
  const processResult = await processFileToKnowledgeBase(
    userId,
    uploadResult.data.public_url,
    knowledgeBaseId,
    mode
  )

  return processResult
}

/**
 * Delete file from knowledge base
 */
export async function deleteFileFromKnowledgeBase(
  userId: string,
  fileId: string,
  knowledgeBaseId: string
): Promise<FileDeleteResponse> {
  const response = await authenticatedFormPost('/user/file/delete_file', {
    user_id: userId,
    file_id: fileId,
    knowledge_base_id: knowledgeBaseId
  })

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Get supported file types
 */
export async function getSupportedFileTypes(): Promise<string[]> {
  try {
    const response = await fetch('/api/file/supported_types', {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Failed to get supported file types: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.supported_file_types || []
  } catch (error) {
    console.warn('Failed to fetch supported file types from backend, using default list')
    // Return default supported file types
    return [
      '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.odt', '.ods', '.odp', '.txt', '.rtf', '.jpg',
      '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.html',
      '.htm', '.md', '.csv', '.tsv', '.xml', '.pdf',
      '.py', '.ipynb', '.js', '.json'
    ]
  }
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(filename: string, supportedTypes: string[]): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return supportedTypes.includes(extension)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file type category for UI display
 */
export function getFileTypeCategory(filename: string): 'image' | 'document' | 'code' | 'other' {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  const imageTypes = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp']
  const documentTypes = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.pdf', '.txt', '.md', '.html', '.htm']
  const codeTypes = ['.py', '.js', '.json', '.ipynb', '.xml', '.csv', '.tsv']
  
  if (imageTypes.includes(extension)) return 'image'
  if (documentTypes.includes(extension)) return 'document'
  if (codeTypes.includes(extension)) return 'code'
  return 'other'
}
