import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

interface ChatHistoryContentItem {
    session_id: string
    role: string
    content: string
    timestamp: string
}

interface CurrentChatMessage {
    key: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    streaming?: boolean
}

export const useChatHistoryContentStore = defineStore('chathistorycontent', () => {
    const chatHistoryContent = ref<ChatHistoryContentItem[]>([])
    // 新增：当前聊天会话的实时消息
    const currentChatMessages = ref<CurrentChatMessage[]>([])
    // 新增：当前流式响应的消息
    const streamingMessage = ref<CurrentChatMessage | null>(null)

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

    // 新增：添加用户消息到当前聊天
    function addUserMessage(content: string) {
        const message: CurrentChatMessage = {
            key: `user_${Date.now()}`,
            role: 'user',
            content: content,
            timestamp: new Date().toISOString()
        }
        currentChatMessages.value.push(message)
        console.log('User message added to current chat:', message)
    }

    // 新增：开始AI流式响应
    function startStreamingResponse() {
        const message: CurrentChatMessage = {
            key: `assistant_${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            streaming: true
        }
        streamingMessage.value = message
        currentChatMessages.value.push(message)

        console.log('=== 开始流式响应 ===');
        console.log('消息ID:', message.key);
        console.log('时间戳:', message.timestamp);
        console.log('当前聊天消息总数:', currentChatMessages.value.length);
        console.log('=== 流式响应已启动 ===\n');
    }

    // 新增：更新流式响应内容
    function updateStreamingContent(chunk: string) {
        if (streamingMessage.value) {
            // 详细日志：记录每个内容更新
            console.log('=== 更新流式内容 ===');
            console.log('接收到的块:', JSON.stringify(chunk));
            console.log('块内容:', chunk);
            console.log('当前消息长度:', streamingMessage.value.content.length);

            streamingMessage.value.content += chunk

            console.log('更新后消息长度:', streamingMessage.value.content.length);
            console.log('更新后消息内容 (最后50字符):', streamingMessage.value.content.slice(-50));
            console.log('=== 内容更新完成 ===\n');

            // 更新数组中的对应消息
            const index = currentChatMessages.value.findIndex(msg => msg.key === streamingMessage.value?.key)
            if (index !== -1) {
                currentChatMessages.value[index] = { ...streamingMessage.value }
            }
        } else {
            console.warn('⚠ 尝试更新流式内容，但没有活跃的流式消息');
        }
    }

    // 新增：完成流式响应
    function finishStreamingResponse() {
        if (streamingMessage.value) {
            console.log('=== 完成流式响应 ===');
            console.log('消息ID:', streamingMessage.value.key);
            console.log('最终内容长度:', streamingMessage.value.content.length);
            console.log('最终内容:', streamingMessage.value.content);

            streamingMessage.value.streaming = false
            const index = currentChatMessages.value.findIndex(msg => msg.key === streamingMessage.value?.key)
            if (index !== -1) {
                currentChatMessages.value[index] = { ...streamingMessage.value }
                console.log('消息已更新到聊天历史，索引:', index);
            }
            streamingMessage.value = null
            console.log('=== 流式响应已完成 ===\n');
        } else {
            console.warn('⚠ 尝试完成流式响应，但没有活跃的流式消息');
        }
    }

    // 新增：清空当前聊天消息
    function clearCurrentChat() {
        currentChatMessages.value = []
        streamingMessage.value = null
        console.log('Current chat messages cleared')
    }

    return {
        chatHistoryContent,
        currentChatMessages,
        streamingMessage,
        getChatHistoryContent,
        addUserMessage,
        startStreamingResponse,
        updateStreamingContent,
        finishStreamingResponse,
        clearCurrentChat
    }
})