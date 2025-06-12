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

    async function createKnowledgeBase(name: string = '', description: string = '') {
      const userStore = useUserStore()
      const token = userStore.user?.token
      const userId = userStore.user?.id

      let knowledgebase_id = ''
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

        console.log('发送创建知识库请求:', {
          mode: 'update',
          name,
          description,
          user_id: userId,
          knowledgebase_id
        })

        const response = await fetch('/user/knowledgebase/create', {
          method: 'POST',
          body: formData
        })

        console.log('创建知识库响应状态:', response.status, response.statusText)

        if (!response.ok) {
          // 尝试解析错误响应
          let errorMessage = '创建知识库失败，请稍后重试'
          try {
            const errorData = await response.json()
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch (parseError) {
            console.warn('无法解析错误响应:', parseError)
          }
          throw new Error(errorMessage)
        }

        const responseText = await response.text()
        console.log('创建知识库原始响应:', responseText)

        // 检查响应是否为空
        if (!responseText || responseText.trim() === '') {
          console.warn('服务器返回空响应，但状态码为成功，假设创建成功')
          await fetchKnowledgeBaseList()
          console.log('知识库创建成功（空响应），已刷新列表')
          return
        }

        let data: any
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('解析响应JSON失败:', parseError)
          console.error('原始响应内容:', responseText)
          // 如果JSON解析失败但HTTP状态码是成功的，我们假设操作成功
          if (response.status >= 200 && response.status < 300) {
            console.warn('JSON解析失败但HTTP状态成功，假设创建成功')
            await fetchKnowledgeBaseList()
            console.log('知识库创建成功（解析失败），已刷新列表')
            return
          }
          throw new Error('服务器响应格式错误')
        }

        console.log('创建知识库解析后响应:', data)

        // 检查响应格式并处理
        if (data.success === true) {
          // 创建成功，刷新知识库列表
          await fetchKnowledgeBaseList()
          console.log('知识库创建成功，已刷新列表')
        } else if (data.success === false) {
          error.value = data.message || '创建知识库失败'
          throw new Error(error.value)
        } else {
          // 兼容旧格式或其他格式 - 如果没有success字段，假设成功
          console.warn('响应格式不标准，假设创建成功')
          await fetchKnowledgeBaseList()
          console.log('知识库创建完成（兼容模式），已刷新列表')
        }
      } catch (err: any) {
        console.error('Failed to create knowledge base:', err)
        // 如果error.value还没有设置，设置一个通用错误消息
        if (!error.value) {
          error.value = err.message || '创建知识库失败，请稍后重试'
        }
        // 重新抛出错误，让调用方知道操作失败
        throw err
      } finally {
        isLoading.value = false
      }
    }

    async function updateKnowledgeBase(knowledgebase_id: string, name: string, description: string) {
      const userStore = useUserStore()
      const token = userStore.user?.token
      const userId = userStore.user?.id

      if (!userId || !token) {
        console.warn('No user ID or token available for updating knowledge base')
        error.value = '用户未登录或认证信息无效'
        return
      }

      if (!knowledgebase_id) {
        error.value = '知识库ID不能为空'
        return
      }

      isLoading.value = true
      error.value = null

      try {
        const formData = new FormData()
        formData.append('mode', 'update')
        formData.append('knowledgebase_id', knowledgebase_id)
        formData.append('name', name)
        formData.append('description', description)
        formData.append('user_id', userId)
        formData.append('token', token)

        console.log('发送更新知识库请求:', {
          mode: 'update',
          knowledgebase_id,
          name,
          description,
          user_id: userId
        })

        const response = await fetch('/user/knowledgebase/update', {
          method: 'POST',
          body: formData
        })

        console.log('更新知识库响应状态:', response.status, response.statusText)

        if (!response.ok) {
          // 尝试解析错误响应
          let errorMessage = '更新知识库失败，请稍后重试'
          try {
            const errorData = await response.json()
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch (parseError) {
            console.warn('无法解析错误响应:', parseError)
          }
          throw new Error(errorMessage)
        }

        const responseText = await response.text()
        console.log('更新知识库原始响应:', responseText)

        // 检查响应是否为空
        if (!responseText || responseText.trim() === '') {
          console.warn('服务器返回空响应，但状态码为成功，假设更新成功')
          await fetchKnowledgeBaseList()
          console.log('知识库更新成功（空响应），已刷新列表')
          return
        }

        let data: any
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('解析响应JSON失败:', parseError)
          console.error('原始响应内容:', responseText)
          // 如果JSON解析失败但HTTP状态码是成功的，我们假设操作成功
          if (response.status >= 200 && response.status < 300) {
            console.warn('JSON解析失败但HTTP状态成功，假设更新成功')
            await fetchKnowledgeBaseList()
            console.log('知识库更新成功（解析失败），已刷新列表')
            return
          }
          throw new Error('服务器响应格式错误')
        }

        console.log('更新知识库解析后响应:', data)

        // 检查响应格式并处理
        if (data.success === true) {
          // 更新成功，刷新知识库列表
          await fetchKnowledgeBaseList()
          console.log('知识库更新成功，已刷新列表')
        } else if (data.success === false) {
          error.value = data.message || '更新知识库失败'
          throw new Error(error.value)
        } else {
          // 兼容旧格式或其他格式 - 如果没有success字段，假设成功
          console.warn('响应格式不标准，假设更新成功')
          await fetchKnowledgeBaseList()
          console.log('知识库更新完成（兼容模式），已刷新列表')
        }
      } catch (err: any) {
        console.error('Failed to update knowledge base:', err)
        // 如果error.value还没有设置，设置一个通用错误消息
        if (!error.value) {
          error.value = err.message || '更新知识库失败，请稍后重试'
        }
        // 重新抛出错误，让调用方知道操作失败
        throw err
      } finally {
        isLoading.value = false
      }
    }

    async function deleteKnowledgeBase(knowledgebase_id: string) {
      const userStore = useUserStore()
      const token = userStore.user?.token
      const userId = userStore.user?.id

      if (!userId || !token) {
        console.warn('No user ID or token available for deleting knowledge base')
        error.value = '用户未登录或认证信息无效'
        return
      }

      if (!knowledgebase_id) {
        error.value = '知识库ID不能为空'
        return
      }

      isLoading.value = true
      error.value = null

      try {
        const formData = new FormData()
        formData.append('mode', 'delete')
        formData.append('knowledgebase_id', knowledgebase_id)
        formData.append('user_id', userId)
        formData.append('token', token)

        console.log('发送删除知识库请求:', {
          mode: 'delete',
          knowledgebase_id,
          user_id: userId
        })

        const response = await fetch('/user/knowledgebase/delete', {
          method: 'POST',
          body: formData
        })

        console.log('删除知识库响应状态:', response.status, response.statusText)

        if (!response.ok) {
          // 尝试解析错误响应
          let errorMessage = '删除知识库失败，请稍后重试'
          try {
            const errorData = await response.json()
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch (parseError) {
            console.warn('无法解析错误响应:', parseError)
          }
          throw new Error(errorMessage)
        }

        const responseText = await response.text()
        console.log('删除知识库原始响应:', responseText)

        // 检查响应是否为空
        if (!responseText || responseText.trim() === '') {
          console.warn('服务器返回空响应，但状态码为成功，假设删除成功')
          await fetchKnowledgeBaseList()
          console.log('知识库删除成功（空响应），已刷新列表')
          return
        }

        let data: any
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('解析响应JSON失败:', parseError)
          console.error('原始响应内容:', responseText)
          // 如果JSON解析失败但HTTP状态码是成功的，我们假设操作成功
          if (response.status >= 200 && response.status < 300) {
            console.warn('JSON解析失败但HTTP状态成功，假设删除成功')
            await fetchKnowledgeBaseList()
            console.log('知识库删除成功（解析失败），已刷新列表')
            return
          }
          throw new Error('服务器响应格式错误')
        }

        console.log('删除知识库解析后响应:', data)

        // 检查响应格式并处理
        if (data.success === true) {
          // 删除成功，刷新知识库列表
          await fetchKnowledgeBaseList()
          console.log('知识库删除成功，已刷新列表')
        } else if (data.success === false) {
          error.value = data.message || '删除知识库失败'
          throw new Error(error.value)
        } else {
          // 兼容旧格式或其他格式 - 如果没有success字段，假设成功
          console.warn('响应格式不标准，假设删除成功')
          await fetchKnowledgeBaseList()
          console.log('知识库删除完成（兼容模式），已刷新列表')
        }
      } catch (err: any) {
        console.error('Failed to delete knowledge base:', err)
        // 如果error.value还没有设置，设置一个通用错误消息
        if (!error.value) {
          error.value = err.message || '删除知识库失败，请稍后重试'
        }
        // 重新抛出错误，让调用方知道操作失败
        throw err
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

  function setActiveKnowledgeBaseItem(item: KnowledgeBaseItem) {
    activeKnowledgeBaseItem.value = {
      id: item.id,
      name: item.name,
      description: item.description,
      document_count: item.document_count,
      icon: item.icon
    }
    console.log('Active knowledge base item set:', activeKnowledgeBaseItem.value)
  }

  function clearActiveKnowledgeBaseItem() {
    activeKnowledgeBaseItem.value = null
  }

  return {
    // State
    knowledgeBaseList,
    activeKnowledgeBaseItem,
    isLoading,
    error,

    // Actions
    fetchKnowledgeBaseList,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    setActiveKnowledgeBaseItem,
    clearActiveKnowledgeBaseItem,
    clearError
  }
})
