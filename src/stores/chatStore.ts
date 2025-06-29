import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  key: string
  chat_id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
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
  
  // Actions
  setCurrentSession: (sessionId: string) => void
  addUserMessage: (content: string) => void
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

      setCurrentSession: (sessionId: string) => {
        set({ currentSessionId: sessionId, currentMessages: [] })
      },

      addUserMessage: (content: string) => {
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

        const updatedMessage = { ...streamingMessage }
        
        if (content !== undefined && content !== null && content !== '') {
          updatedMessage.content += content
        }
        
        if (reasoningContent !== undefined && reasoningContent !== null && reasoningContent !== '') {
          updatedMessage.reasoning_content = (updatedMessage.reasoning_content || '') + reasoningContent
        }

        set(state => ({
          streamingMessage: updatedMessage,
          currentMessages: state.currentMessages.map(msg => 
            msg.key === updatedMessage.key ? updatedMessage : msg
          )
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
