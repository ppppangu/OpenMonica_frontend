import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

interface ChatHistoryItem {
  session_id: string
  timestamp: string
}

interface ChatHistoryListItem {
  key: string
  label: string
}

interface ActiveChatHistoryItem {
  session_id: string
}

export const useChatHistoryStore = defineStore('chatHistory', () => {
  const chatHistoryList = ref<ChatHistoryListItem[]>([])
  const activeChatHistoryItem = ref<ActiveChatHistoryItem | null>(null)

  async function getChatHistoryList() {
    const userStore = useUserStore()
    const userid = userStore.user?.id
    const token = userStore.user?.token

    if (!userid) {
      console.warn('No user ID available for fetching chat history')
      return
    }

    try {
      const formData = new FormData()
      formData.append('user_id', userid)
      if (token) formData.append('token', token)

      const response = await fetch('/user/chat_history', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      console.log('Chat history API response:', data)

      // 检查响应格式并提取正确的数据
      let sessionsData: ChatHistoryItem[] = []
      if (data && data.data && Array.isArray(data.data)) {
        // 真实后端格式：data.data 直接是数组
        sessionsData = data.data
      } else if (data && data.data && data.data.sessions) {
        // server.js模拟格式：data.data.sessions 是数组
        sessionsData = data.data.sessions
      } else if (data && Array.isArray(data)) {
        // 如果直接返回数组
        sessionsData = data
      } else {
        console.warn('Unexpected response format:', data)
        sessionsData = []
      }

      //结果再转一次列表，确保每个字典的session_id作为key，在列表中的索引+1作为label
      chatHistoryList.value = sessionsData.map((item: any, index: number) => ({
        key: item.session_id,
        label: 'Conversation Item ' + (index + 1),
      }))

      // 如果获取到聊天历史且当前没有活跃项，设置第一个为活跃项
      if (chatHistoryList.value.length > 0 && !activeChatHistoryItem.value) {
        activeChatHistoryItem.value = { session_id: chatHistoryList.value[0].key }
      }

      console.log('Chat history store updated:', chatHistoryList.value)
      console.log('Active chat history item:', activeChatHistoryItem.value)

      // Save to localStorage for persistence
      localStorage.setItem('chatHistory', JSON.stringify(chatHistoryList.value))
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
      // 设置空数组以防止后续错误
      chatHistoryList.value = []
    }
  }

  function setActiveChatHistoryItem(sessionId: string) {
    activeChatHistoryItem.value = { session_id: sessionId }
  }

  function initializeFromStorage() {
    console.log('Initializing chat history from storage...')
    const storedChatHistory = localStorage.getItem('chatHistory')

    if (storedChatHistory) {
      try {
        const parsed = JSON.parse(storedChatHistory)
        // 确保parsed是数组且不为空
        if (Array.isArray(parsed) && parsed.length > 0) {
          chatHistoryList.value = parsed
          activeChatHistoryItem.value = { session_id: parsed[0].key }
          console.log('Chat history loaded from storage:', chatHistoryList.value)
        } else {
          console.log('Stored chat history is empty or invalid, initializing empty state')
          chatHistoryList.value = []
          activeChatHistoryItem.value = null
        }
      } catch (error) {
        console.error('Failed to parse stored chat history:', error)
        chatHistoryList.value = []
        activeChatHistoryItem.value = null
      }
    } else {
      console.log('No chat history found in storage, will load from API')
      chatHistoryList.value = []
      activeChatHistoryItem.value = null
    }
  }

  async function deleteChatHistory(sessionId: string) {
    const userStore = useUserStore()
    const userid = userStore.user?.id
    const token = userStore.user?.token
    if (!userid) {
      console.warn('No user ID available for deleting chat history')
      throw new Error('用户ID不存在')
    }

    if (!sessionId) {
      throw new Error('会话ID不能为空')
    }

    try {
      console.log('=== DELETE CHAT HISTORY DEBUG ===')
      console.log('User store state:', {
        user: userStore.user,
        isAuthenticated: userStore.isAuthenticated,
        isLoggedIn: userStore.isLoggedIn
      })
      console.log('LocalStorage contents:', {
        user: localStorage.getItem('user'),
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        authToken: localStorage.getItem('authToken')
      })
      console.log('Deleting chat history for session:', sessionId)
      console.log('Request payload:', { user_id: userid, session_id: sessionId, token: token })

      const formData = new FormData()
      formData.append('user_id', userid)
      formData.append('session_id', sessionId)
      if (token) formData.append('token', token)

      const response = await fetch('/user/chat_history/delete', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      console.log('Delete chat history API response:', data)
      console.log('Response status:', response.status)

      // 检查不同的响应格式
      if (data && (data.status === 'success' || data.success === true)) {
        console.log('Delete successful, refreshing chat history list...')
        // 删除成功后重新获取最新列表
        await getChatHistoryList()
        return { success: true, message: '删除成功' }
      } else {
        console.error('Delete failed - unexpected response format:', data)
        throw new Error(data?.message || data?.error || '删除失败')
      }
    } catch (error) {
      console.error('Failed to delete chat history:', error)

      // 更详细的错误信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接错误')
      } else if (error instanceof Error) {
        throw new Error(error.message)
      }

      throw error
    }
  }

  function clearChatHistory() {
    chatHistoryList.value = []
    localStorage.removeItem('chatHistory')
  }

  return {
    chatHistoryList,
    getChatHistoryList,
    deleteChatHistory,
    initializeFromStorage,
    clearChatHistory,
    setActiveChatHistoryItem,
    activeChatHistoryItem
  }
})