import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  key: string
  chat_id?: string
  role: 'user' | 'assistant' | 'system'
  content: string | any[]
  timestamp: string
  streaming?: boolean
  reasoning_content?: string
}

export interface ChatSession {
  session_id: string
  session_name: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ToolCall {
  id: string
  tool: string
  arguments: Record<string, any>
  status: 'invoking' | 'done' | 'error'
  result?: string
  error?: string
}

interface ChatState {
  // Current chat session
  currentSessionId: string | null
  currentMessages: ChatMessage[]
  streamingMessage: ChatMessage | null

  // Chat history
  chatSessions: ChatSession[]

  // Tool calls
  toolCalls: Record<string, ToolCall>

  // Model selection
  selectedModelIds: string[]

  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentSession: (sessionId: string) => void
  addUserMessage: (content: string | any[]) => void
  startStreamingResponse: (chatId?: string) => void
  updateStreamingContent: (content?: string, reasoningContent?: string) => void
  finishStreamingResponse: () => void
  clearCurrentChat: () => void
  setChatSessions: (sessions: ChatSession[]) => void
  setCurrentMessages: (messages: ChatMessage[]) => void

  // Tool call actions
  addToolCall: (toolCall: ToolCall) => void
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void
  removeToolCall: (id: string) => void

  // Model actions
  setSelectedModels: (modelIds: string[]) => void
  createNewSession: () => string
  loadSessionMessages: (sessionId: string, messages: ChatMessage[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  startNewConversation: () => string
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      currentMessages: [],
      streamingMessage: null,
      chatSessions: [],
      toolCalls: {},
      selectedModelIds: [],
      isLoading: false,
      error: null,

      setCurrentSession: (sessionId: string) => {
        set({ currentSessionId: sessionId, currentMessages: [] })
      },

      addUserMessage: (content: string | any[]) => {
        const message: ChatMessage = {
          key: `user_${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }
        
        set(state => ({
          currentMessages: [...state.currentMessages, message]
        }))
      },

      startStreamingResponse: (chatId?: string) => {
        const message: ChatMessage = {
          key: `assistant_${Date.now()}`,
          chat_id: chatId,
          role: 'assistant',
          content: '',
          reasoning_content: '',
          timestamp: new Date().toISOString(),
          streaming: true
        }
        
        set(state => ({
          streamingMessage: message,
          currentMessages: [...state.currentMessages, message]
        }))
      },

      updateStreamingContent: (content?: string, reasoningContent?: string) => {
        const { streamingMessage } = get()
        if (!streamingMessage) return

        const updated = { ...streamingMessage }

        // 确保 content 为 string
        if (typeof updated.content !== 'string') {
          updated.content = ''
        }

        const appendText = (text: string, isReason: boolean) => {
          const current = updated.content as string

          // 判断当前是否位于 <think> 内
          const lastOpen = current.lastIndexOf('<think>')
          const lastClose = current.lastIndexOf('</think>')
          const inThink = lastOpen > lastClose

          let newStr = current

          if (isReason) {
            if (!current) {
              newStr += `<think>` + text
            } else if (inThink) {
              newStr += text
            } else {
              newStr += `\n<think>` + text
            }
            // reasoning_content 仅作兼容保留
            updated.reasoning_content = (updated.reasoning_content || '') + text
          } else {
            if (inThink) {
              newStr += `</think>` + text
            } else {
              newStr += text
            }
          }

          updated.content = newStr
        }

        if (reasoningContent && reasoningContent !== '') {
          appendText(reasoningContent, true)
        }

        if (content && content !== '') {
          appendText(content, false)
        }

        set(state => ({
          streamingMessage: updated,
          currentMessages: state.currentMessages.map(m => m.key === updated.key ? updated : m)
        }))
      },

      finishStreamingResponse: () => {
        const { streamingMessage } = get()
        if (!streamingMessage) return

        const finishedMessage = { ...streamingMessage, streaming: false }
        
        set(state => ({
          streamingMessage: null,
          currentMessages: state.currentMessages.map(msg => 
            msg.key === finishedMessage.key ? finishedMessage : msg
          )
        }))
      },

      clearCurrentChat: () => {
        set({ currentMessages: [], streamingMessage: null })
      },

      setChatSessions: (sessions: ChatSession[]) => {
        set({ chatSessions: sessions })
      },

      setCurrentMessages: (messages: ChatMessage[]) => {
        set({ currentMessages: messages })
      },

      addToolCall: (toolCall: ToolCall) => {
        set(state => ({
          toolCalls: { ...state.toolCalls, [toolCall.id]: toolCall }
        }))
      },

      updateToolCall: (id: string, updates: Partial<ToolCall>) => {
        set(state => ({
          toolCalls: {
            ...state.toolCalls,
            [id]: { ...state.toolCalls[id], ...updates }
          }
        }))
      },

      removeToolCall: (id: string) => {
        set(state => {
          const { [id]: removed, ...rest } = state.toolCalls
          return { toolCalls: rest }
        })
      },

      setSelectedModels: (modelIds: string[]) => {
        set({ selectedModelIds: modelIds })
      },

      createNewSession: () => {
        const sessionId = `ss${Date.now()}`
        set({
          currentSessionId: sessionId,
          currentMessages: [],
          streamingMessage: null
        })
        return sessionId
      },

      loadSessionMessages: (sessionId: string, messages: ChatMessage[]) => {
        set({
          currentSessionId: sessionId,
          currentMessages: messages,
          streamingMessage: null,
          error: null
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false })
      },

      clearError: () => {
        set({ error: null })
      },

      // 兼容新命名：startNewConversation -> 实际调用 createNewSession
      startNewConversation: () => {
        return get().createNewSession()
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        selectedModelIds: state.selectedModelIds
      }),
    }
  )
)
