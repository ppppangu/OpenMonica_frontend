export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning_content?: string | null
  isToolCall?: boolean // 是否工具调用
  toolResponse?: {
    params: string
    tool_response: string
    is_error: string
  }
  timestamp?: number
} 