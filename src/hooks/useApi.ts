import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authenticatedFormPost, authenticatedGet, handleApiResponse } from '../utils/api'

// Chat History Hooks
export const useChatHistory = (userId: string) => {
  return useQuery({
    queryKey: ['chatHistory', userId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/chat_history', {
        user_id: userId,
        mode: 'get_all_list'
      })
      const result: any = await handleApiResponse(response)
      // Extract data array from the response
      return result?.data || []
    },
    enabled: !!userId,
  })
}

export const useChatHistoryContent = (userId: string, sessionId: string) => {
  return useQuery({
    queryKey: ['chatHistoryContent', userId, sessionId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/chat_history', {
        user_id: userId,
        session_id: sessionId,
        mode: 'get_specific'
      })
      const result: any = await handleApiResponse(response)
      // Extract chat history from the response
      return result?.data || null
    },
    enabled: !!userId && !!sessionId,
  })
}

// Knowledge Base Hooks
export const useKnowledgeBaseList = (userId: string) => {
  return useQuery({
    queryKey: ['knowledgeBaseList', userId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/knowledgebase/get_list', {
        user_id: userId
      })
      const result: any = await handleApiResponse(response)
      return result?.data || []
    },
    enabled: !!userId,
  })
}

export const useKnowledgeBaseDetail = (knowledgebaseId: string) => {
  return useQuery({
    queryKey: ['knowledgeBaseDetail', knowledgebaseId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/knowledgebase/get_detail', {
        knowledgebase_id: knowledgebaseId
      })
      const result: any = await handleApiResponse(response)
      return result?.data || null
    },
    enabled: !!knowledgebaseId,
  })
}

// Model List Hook
export const useModelList = (userId: string) => {
  return useQuery({
    queryKey: ['modelList', userId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/model/get_list', {
        user_id: userId
      })
      const result: any = await handleApiResponse(response)
      // Transform the API response to match the expected format
      const modelData = result?.data || result || []
      if (Array.isArray(modelData)) {
        return modelData.map((model: any) => ({
          model_id: model.id,
          model_name: model.alias || model.id,
          owned_by: model.owned_by,
          created: model.created,
          object: model.object
        }))
      }
      return []
    },
    enabled: !!userId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Chat Streaming Hook
export const useChatStream = () => {
  return useMutation({
    mutationFn: async (data: {
      user_id: string
      model: string
      messages: any[]
      text?: string
    }) => {
      const formData = new FormData()
      formData.append('user_id', data.user_id)
      formData.append('model', data.model)

      if (data.messages && data.messages.length > 0) {
        formData.append('user_message_list', JSON.stringify(data.messages))
      } else if (data.text) {
        formData.append('text', data.text)
      }

      // Return the URL for SSE connection
      const response = await fetch('/user/chat', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to start chat stream')
      }

      return response
    },
  })
}

// Mutations
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // Don't use authenticatedFormPost for login since we don't have a token yet
      const formData = new FormData()
      formData.append('email', credentials.email)
      formData.append('password', credentials.password)
      // Server side expects a "mode" field to distinguish login from other operations
      // Set to "login" to route the request correctly in the unified account handler
      formData.append('mode', 'login')

      const response = await fetch('/user/account', {
        method: 'POST',
        body: formData
      })
      return await handleApiResponse(response)
    },
  })
}

export const useSignupMutation = () => {
  return useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string }) => {
      // Use the correct signup endpoint
      const formData = new FormData()
      formData.append('username', userData.username)
      formData.append('email', userData.email)
      formData.append('password', userData.password)

      const response = await fetch('/user/register', {
        method: 'POST',
        body: formData
      })
      return await handleApiResponse(response)
    },
  })
}

export const useFileUploadMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      // 调用后端 MinIO 上传接口，返回包含 public_url 的响应
      const response = await fetch('/user/file/upload_file', {
        method: 'POST',
        body: formData
      })
      return await handleApiResponse(response)
    },
    onSuccess: () => {
      // Invalidate file-related queries
      queryClient.invalidateQueries({ queryKey: ['fileAttachments'] })
    },
  })
}

export const useKnowledgeBaseCreateMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description: string; user_id: string }) => {
      const response = await authenticatedFormPost('/user/knowledgebase/create', data)
      return await handleApiResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseList'] })
    },
  })
}

export const useChatHistoryDeleteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { user_id: string; session_id: string }) => {
      const response = await authenticatedFormPost('/user/chat_history', {
        user_id: data.user_id,
        session_id: data.session_id,
        mode: 'delete_specific'
      })
      return await handleApiResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
    },
  })
}

export const useDocumentUploadMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/user/knowledgebase/upload_document', {
        method: 'POST',
        body: formData,
      })
      return await handleApiResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseDetail'] })
    },
  })
}

export const useKnowledgeBaseDeleteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFormPost('/user/knowledgebase/delete', { knowledgebase_id: id })
      return await handleApiResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseList'] })
    },
  })
}

export const useDocumentDeleteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFormPost('/user/knowledgebase/delete_document', { document_id: id })
      return await handleApiResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseDetail'] })
    },
  })
}

// ----------------- 自定义提示 & 模型记忆 -----------------
export const useCustomData = (userId: string, target: 'custom_personality' | 'custom_memory') => {
  return useQuery({
    queryKey: ['custom', userId, target],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/custom', {
        user_id: userId,
        mode: 'get',
        target
      })
      const result: any = await handleApiResponse(response)
      return result?.data ?? ''
    },
    enabled: !!userId && !!target,
  })
}

export const useUpdateCustomDataMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { user_id: string; target: 'custom_personality' | 'custom_memory'; new_text: string }) => {
      const response = await authenticatedFormPost('/user/custom', {
        ...params,
        mode: 'update'
      })
      return await handleApiResponse(response)
    },
    onSuccess: (_data, variables) => {
      // Update cache immediately
      queryClient.invalidateQueries({ queryKey: ['custom', variables.user_id, variables.target] })
    },
  })
}
