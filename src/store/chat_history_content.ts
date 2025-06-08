import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

interface ChatHistoryContentItem {
    session_id: string
    role: string
    content: string
    timestamp: string
}

export const useChatHistoryContentStore = defineStore('chathistorycontent', () => {
    const chatHistoryContent = ref<ChatHistoryContentItem[]>([])

    async function getChatHistoryContent(sessionId: string) {
        const userStore = useUserStore()
        const userid = userStore.user?.id
        const token = userStore.user?.token

        if (!userid) {
            console.warn('No user ID available for fetching chat history content')
            return
        }

        if (!sessionId) {
            console.warn('No session ID available for fetching chat history content')
            return
        }


        try {
            const formData = new FormData()
            formData.append('user_id', userid)
            formData.append('session_id', sessionId)
            if (token) formData.append('token', token)

            const response = await fetch('/user/chat_history/get_content', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            console.log('Chat history content API response:', data)

            // 检查响应格式并提取正确的数据
            let contentData: ChatHistoryContentItem[] = []
            if (data && Array.isArray(data)) {
                // 真实后端格式：data 直接是数组
                contentData = data
            }

            chatHistoryContent.value = contentData
            console.log('Chat history content store updated:', chatHistoryContent.value)
        } catch (error) {
            console.error('Fetch chat history content failed:', error)
        }
    }

    return {
        chatHistoryContent,
        getChatHistoryContent

    }
})