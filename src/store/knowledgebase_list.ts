import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

interface KnowledgeBaseItem {
  id: string
  name: string
  description: string
  document_count: number
  icon?: string
  color_variant?: 'blue' | 'green' | 'purple'
  created_at?: string
  updated_at?: string
}

interface ActiveKnowledgeBaseItem {
  id: string
  name: string
  description: string
  document_count: number
  icon?: string
}

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  // State
  const knowledgeBaseList = ref<KnowledgeBaseItem[]>([])
  const activeKnowledgeBaseItem = ref<ActiveKnowledgeBaseItem | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchKnowledgeBaseList() {
    const userStore = useUserStore()
    const userId = userStore.user?.id
    const token = userStore.user?.token

    if (!userId || !token) {
      console.warn('No user ID or token available for fetching knowledge base list')
      error.value = '用户未登录或认证信息无效'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // 创建 FormData 对象，按照后端期望的格式
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('token', token)

      console.log('发送知识库列表请求:', {
        userId,
        token: token.substring(0, 10) + '...',
        endpoint: '/user/knowledgebase/get_list'
      })

      const response = await fetch('/user/knowledgebase/get_list', {
        method: 'POST',
        body: formData
      })

      console.log('知识库列表响应状态:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // 处理响应数据，确保格式正确
      if (Array.isArray(data)) {
        knowledgeBaseList.value = data.map((item: any, index: number) => ({
          id: item.id || item.knowledgebase_id || `kb_${index}`,
          name: item.name || `知识库 ${index + 1}`,
          description: item.description || '暂无描述',
          document_count: item.document_count || 0,
          icon: item.icon || getDefaultIcon(index),
          color_variant: getColorVariant(index),
          created_at: item.created_at,
          updated_at: item.updated_at
        }))
      } else {
        knowledgeBaseList.value = []
      }

      console.log('Knowledge base list updated:', knowledgeBaseList.value)
    } catch (err) {
      console.error('Failed to fetch knowledge base list:', err)
      console.warn('后端服务不可用，使用本地模拟知识库数据')

      // 模拟知识库数据（用于开发测试）
      const mockKnowledgeBases = [
        {
          id: 'kb_1',
          name: '金融知识库',
          description: '学习金融过程中的知识库',
          document_count: 4,
          icon: '📝',
          color_variant: 'blue' as const,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'kb_2',
          name: '法律知识库',
          description: '法律相关资料',
          document_count: 3,
          icon: '📚',
          color_variant: 'green' as const,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'kb_3',
          name: '设计知识库',
          description: '设计相关的资料和灵感',
          document_count: 7,
          icon: '🎨',
          color_variant: 'purple' as const,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date(Date.now() - 10800000).toISOString()
        }
      ]

      knowledgeBaseList.value = mockKnowledgeBases
      console.log('Using mock knowledge base data:', knowledgeBaseList.value)
    } finally {
      isLoading.value = false
    }
  }

    async function createKnowledgeBase(userId: string, knowledgebase_id: string = '', name: string = '', description: string = '') {
      const userStore = useUserStore()
      const token = userStore.user?.token

      if (!userId || !token) {
        console.warn('No user ID or token available for creating knowledge base')
        error.value = '用户未登录或认证信息无效'
        return
      }

      isLoading.value = true
      error.value = null

      try {
        const formData = new FormData()
        // 没传入的话生成一个随机id
        if (!knowledgebase_id) {
          knowledgebase_id = Math.random().toString(36).substring(2, 15)
          formData.append('knowledgebase_id', knowledgebase_id)
        } else {
          formData.append('knowledgebase_id', knowledgebase_id)
        }
        // 用的就是update
        formData.append('mode', 'update')
        formData.append('name', name)
        formData.append('description', description)
        formData.append('user_id', userId)
        formData.append('token', token)

        const response = await fetch('/user/knowledgebase/create', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('创建知识库响应:', data)
        if (data.success) {
          await fetchKnowledgeBaseList()
        } else {
          error.value = data.message
        }
      } catch (err) {
        console.error('Failed to create knowledge base:', err)
        error.value = '创建知识库失败，请稍后重试'
      } finally {
        isLoading.value = false
      }
    }

  // Helper functions
  function getDefaultIcon(index: number): string {
    const icons = ['📝', '📚', '🎨', '💼', '🔬', '🎯', '📊', '🌟']
    return icons[index % icons.length]
  }

  function getColorVariant(index: number): 'blue' | 'green' | 'purple' {
    const variants: ('blue' | 'green' | 'purple')[] = ['blue', 'green', 'purple']
    return variants[index % variants.length]
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    knowledgeBaseList,
    isLoading,
    error,

    // Actions
    fetchKnowledgeBaseList,
    clearError
  }
})
