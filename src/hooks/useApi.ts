import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authenticatedFormPost, authenticatedGet, handleApiResponse } from '../utils/api'

// Chat History Hooks
export const useChatHistory = (userId: string) => {
  return useQuery({
    queryKey: ['chatHistory', userId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/chat_history/get_list', {
        user_id: userId
      })
      return handleApiResponse(response)
    },
    enabled: !!userId,
  })
}

export const useChatHistoryContent = (sessionId: string) => {
  return useQuery({
    queryKey: ['chatHistoryContent', sessionId],
    queryFn: async () => {
      const response = await authenticatedFormPost('/user/chat_history/get_content', {
        session_id: sessionId
      })
      return handleApiResponse(response)
    },
    enabled: !!sessionId,
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
      return handleApiResponse(response)
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
      return handleApiResponse(response)
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
      return handleApiResponse(response)
    },
    enabled: !!userId,
  })
}

// Mutations
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await authenticatedFormPost('/user/account', {
        email: credentials.email,
        password: credentials.password,
        mode: 'login'
      })
      return handleApiResponse(response)
    },
  })
}

export const useSignupMutation = () => {
  return useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string }) => {
      const response = await authenticatedFormPost('/user/account', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        mode: 'register'
      })
      return handleApiResponse(response)
    },
  })
}

export const useFileUploadMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/user/file/upload_file', {
        method: 'POST',
        body: formData
      })
      return handleApiResponse(response)
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
      return handleApiResponse(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBaseList'] })
    },
  })
}
