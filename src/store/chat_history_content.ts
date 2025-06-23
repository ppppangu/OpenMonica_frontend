import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user_info'

interface ChatHistoryContentItem {
    session_id: string
    chat_id: string  // 新增：每个气泡的唯一ID
    role: string
    content: string
    timestamp: string
}

interface CurrentChatMessage {
    key: string
    chat_id?: string  // 新增：对应后端返回的chat_id
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    streaming?: boolean
    reasoning_content?: string  // 新增：推理内容
}

// 新增：OpenAI格式SSE响应的类型定义
interface OpenAISSEChunk {
    id: string
    object: string
    created: number
    model: string
    choices: Array<{
        index: number
        delta: {
            content?: string
            reasoning_content?: string
            role?: string
        }
        finish_reason: string | null
    }>
    system_fingerprint: string
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

// 新增：工具调用结果的类型定义
interface ToolCallResult {
    params: string  // JSON字符串格式的工具调用参数
    tool_response: string  // 工具执行结果
    is_error: string  // "true" 或 "false"
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

    // 新增：开始AI流式响应，支持OpenAI格式
    function startStreamingResponse(chatId?: string) {
        const message: CurrentChatMessage = {
            key: `assistant_${Date.now()}`,
            chat_id: chatId,  // 使用后端返回的chat_id
            role: 'assistant',
            content: '',
            reasoning_content: '',  // 初始化推理内容
            timestamp: new Date().toISOString(),
            streaming: true
        }
        streamingMessage.value = message
        currentChatMessages.value.push(message)

        console.log('=== 开始流式响应 ===');
        console.log('消息ID:', message.key);
        console.log('Chat ID:', message.chat_id);
        console.log('时间戳:', message.timestamp);
        console.log('当前聊天消息总数:', currentChatMessages.value.length);
        console.log('=== 流式响应已启动 ===\n');
    }

    // 新增：更新流式响应内容，支持OpenAI格式的content和reasoning_content
    function updateStreamingContent(content?: string, reasoningContent?: string) {
        if (streamingMessage.value) {
            // 详细日志：记录每个内容更新
            console.log('=== 更新流式内容 ===');
            console.log('接收到的内容块:', JSON.stringify(content));
            console.log('接收到的推理块:', JSON.stringify(reasoningContent));
            console.log('当前消息长度:', streamingMessage.value.content.length);
            console.log('当前推理长度:', streamingMessage.value.reasoning_content?.length || 0);

            // 更新正文内容（忽略空串 & null）
            if (content !== undefined && content !== null && content !== '') {
                streamingMessage.value.content += content
            }

            // 更新推理内容（忽略空串 & null）
            if (reasoningContent !== undefined && reasoningContent !== null && reasoningContent !== '') {
                streamingMessage.value.reasoning_content = (streamingMessage.value.reasoning_content || '') + reasoningContent
            }

            console.log('更新后消息长度:', streamingMessage.value.content.length);
            console.log('更新后推理长度:', streamingMessage.value.reasoning_content?.length || 0);
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

    // 新增：在收到后端首个 chunk 时更新 chat_id（如果此前未知）
    function setStreamingChatId(chatId: string) {
        if (streamingMessage.value && !streamingMessage.value.chat_id) {
            streamingMessage.value.chat_id = chatId

            // 同步到 currentChatMessages 中对应条目
            const index = currentChatMessages.value.findIndex(msg => msg.key === streamingMessage.value?.key)
            if (index !== -1) {
                currentChatMessages.value[index] = { ...streamingMessage.value }
            }
        }
    }

    // 新增：清空当前聊天消息
    function clearCurrentChat() {
        currentChatMessages.value = []
        streamingMessage.value = null
        console.log('Current chat messages cleared')
    }

    // 新增：解析OpenAI格式的SSE数据块
    function parseOpenAISSEChunk(chunkData: string): { chatId?: string, content?: string, reasoningContent?: string, isToolCall?: boolean, toolResult?: ToolCallResult, isFinished?: boolean } {
        try {
            const parsed: OpenAISSEChunk = JSON.parse(chunkData)

            // 提取 chat_id（使用 id 字段作为 chat_id 映射）
            const chatId = parsed.id

            if (parsed.choices && parsed.choices.length > 0) {
                const choice = parsed.choices[0]
                const delta = choice.delta

                // 检查是否结束
                const isFinished = choice.finish_reason === 'stop'

                // 1. system 块：统一作为普通内容处理，由上层的工具解析器再分析
                if (delta.role === 'system') {
                    return {
                        chatId,
                        content: delta.content,
                        reasoningContent: delta.reasoning_content,
                        isFinished
                    }
                }

                // 2. 普通内容/推理内容块
                return {
                    chatId,
                    content: delta.content,
                    reasoningContent: delta.reasoning_content,
                    isFinished
                }
            }

            return { isFinished: false }
        } catch (error) {
            console.error('Failed to parse OpenAI SSE chunk:', error)
            return { isFinished: false }
        }
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
        setStreamingChatId,
        clearCurrentChat,
        parseOpenAISSEChunk
    }
})