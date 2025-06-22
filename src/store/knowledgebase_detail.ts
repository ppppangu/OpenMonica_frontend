import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'
import { useKnowledgeBaseStore } from './knowledgebase_list'
import { authenticatedFormPost } from '../utils/api'
import { deleteFileFromKnowledgeBase } from '../utils/fileManagementApi'

interface DocumentDetail {
  document_id: string
  document_name: string
  pdf_file_path: string
  markdown_file_path: string
  upload_time: string
  // Legacy fields for backward compatibility
  document_url?: string
  document_markdown_url?: string
  // Mock fields for missing backend data
  file_size?: string
  file_type?: string
}

export const useKnowledgeBaseDetailStore = defineStore('knowledgeBaseDetail', () => {
  // State
  const documentDetailList = ref<DocumentDetail[]>([])
  const activeDocumentDetail = ref<DocumentDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchKnowledgeBaseDetail(knowledgebaseId?: string) {
    const userStore = useUserStore()
    const knowledgeBaseStore = useKnowledgeBaseStore()

    const userId = userStore.user?.id
    const token = userStore.user?.token

    // 如果没有传入 knowledgebaseId，尝试从 activeKnowledgeBaseItem 获取
    const targetKnowledgebaseId = knowledgebaseId || knowledgeBaseStore.activeKnowledgeBaseItem?.id

    if (!userId || !token) {
      console.warn('No user ID or token available for fetching knowledge base detail')
      error.value = '用户未登录或认证信息无效'
      return
    }

    if (!targetKnowledgebaseId) {
      console.warn('No knowledge base ID available for fetching detail')
      error.value = '未指定知识库ID'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('发送知识库详情请求:', {
        userId,
        knowledgebaseId: targetKnowledgebaseId,
        endpoint: '/user/knowledgebase/get_detail'
      })

      // Use the new authenticated form post utility
      const response = await authenticatedFormPost('/user/knowledgebase/get_detail', {
        user_id: userId,
        knowledgebase_id: targetKnowledgebaseId
      })

      console.log('知识库详情响应状态:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // 处理响应数据，根据新的API结构
      if (data && data.documents && Array.isArray(data.documents)) {
        // 直接从响应中提取文档列表
        documentDetailList.value = data.documents.map((doc: any, index: number) => {
          // 生成模拟数据
          const mockFileTypes = ['PDF', 'DOCX', 'TXT', 'MD']
          const mockFileSizes = ['2.3 MB', '1.8 MB', '456 KB', '3.1 MB', '892 KB']

          return {
            document_id: doc.id || `doc_${index}`,
            document_name: doc.name || `文档 ${index + 1}`,
            pdf_file_path: doc.pdf_file_path || '',
            markdown_file_path: doc.markdown_file_path || '',
            upload_time: doc.upload_time || new Date().toISOString(),
            // Legacy fields for backward compatibility
            document_url: doc.pdf_file_path || '',
            document_markdown_url: doc.markdown_file_path || '',
            file_size: mockFileSizes[index % mockFileSizes.length],
            file_type: mockFileTypes[index % mockFileTypes.length]
          }
        })
      } else if (Array.isArray(data)) {
        // 兼容旧的API响应格式
        documentDetailList.value = data.map((item: any, index: number) => {
          const mockFileTypes = ['PDF', 'DOCX', 'TXT', 'MD']
          const mockFileSizes = ['2.3 MB', '1.8 MB', '456 KB', '3.1 MB', '892 KB']
          const mockUploadTimes = [
            '2024-01-15 14:30',
            '2024-01-14 09:15',
            '2024-01-13 16:45',
            '2024-01-12 11:20',
            '2024-01-11 13:55'
          ]

          return {
            document_id: item.id || `doc_${index}`,
            document_name: item.name || `文档 ${index + 1}`,
            pdf_file_path: item.pdf_file_path || '',
            markdown_file_path: item.markdown_file_path || '',
            upload_time: item.upload_time || new Date().toISOString(),
            // Legacy fields for backward compatibility
            document_url: item.pdf_file_path || '',
            document_markdown_url: item.markdown_file_path || '',
            file_size: mockFileSizes[index % mockFileSizes.length],
            file_type: mockFileTypes[index % mockFileTypes.length]
          }
        })
      } else {
        documentDetailList.value = []
      }

      console.log('Knowledge base detail updated:', documentDetailList.value)
    } catch (err) {
      console.error('Failed to fetch knowledge base detail:', err)
      error.value = '获取知识库详情失败，请稍后重试'
      documentDetailList.value = []
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function clearDocuments() {
    documentDetailList.value = []
    activeDocumentDetail.value = null
  }

  function setActiveDocumentDetail(document: DocumentDetail) {
    activeDocumentDetail.value = document
    console.log('Active document detail set:', activeDocumentDetail.value)
  }

  function clearActiveDocumentDetail() {
    activeDocumentDetail.value = null
  }

  async function deleteDocument(documentId: string, knowledgeBaseId?: string) {
    const userStore = useUserStore()
    const knowledgeBaseStore = useKnowledgeBaseStore()

    const userId = userStore.user?.id
    const targetKnowledgeBaseId = knowledgeBaseId || knowledgeBaseStore.activeKnowledgeBaseItem?.id

    if (!userId) {
      throw new Error('用户未登录')
    }

    if (!targetKnowledgeBaseId) {
      throw new Error('未指定知识库ID')
    }

    try {
      console.log('删除文档:', { userId, documentId, targetKnowledgeBaseId })

      const response = await deleteFileFromKnowledgeBase(userId, documentId, targetKnowledgeBaseId)

      if (response.status === 'ok' || response.status === 'success') {
        // Remove the document from the local list
        const index = documentDetailList.value.findIndex(doc => doc.document_id === documentId)
        if (index > -1) {
          documentDetailList.value.splice(index, 1)
        }

        // Clear active document if it was the deleted one
        if (activeDocumentDetail.value?.document_id === documentId) {
          activeDocumentDetail.value = null
        }

        console.log('文档删除成功')
        return true
      } else {
        throw new Error(response.message || '文档删除失败')
      }
    } catch (err) {
      console.error('删除文档失败:', err)
      throw err
    }
  }

  return {
    // State
    documentDetailList,
    activeDocumentDetail,
    isLoading,
    error,

    // Actions
    fetchKnowledgeBaseDetail,
    setActiveDocumentDetail,
    clearActiveDocumentDetail,
    clearError,
    clearDocuments,
    deleteDocument
  }
})