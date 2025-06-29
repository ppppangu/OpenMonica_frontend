import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLoginMutation, useSignupMutation } from './useApi'

export const useAuth = () => {
  const authStore = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useLoginMutation()
  const signupMutation = useSignupMutation()

  // Initialize auth on mount
  useEffect(() => {
    authStore.initializeAuth()
  }, [authStore])

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await loginMutation.mutateAsync(credentials)
      
      if (result.success || result.token) {
        const userData = {
          token: result.token,
          id: result.user_id || result.id,
          email: credentials.email,
          username: result.username || credentials.email.split('@')[0]
        }
        
        authStore.login(userData)
        navigate('/chat')
        return { success: true }
      } else {
        return { success: false, error: result.message || '登录失败' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: '登录失败，请稍后重试' }
    }
  }

  const signup = async (userData: { username: string; email: string; password: string }) => {
    try {
      const result = await signupMutation.mutateAsync(userData)
      
      if (result.success) {
        navigate('/login')
        return { success: true }
      } else {
        return { success: false, error: result.message || '注册失败' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: '注册失败，请稍后重试' }
    }
  }

  const logout = () => {
    authStore.logout()
    navigate('/login')
  }

  const checkAuth = async () => {
    return await authStore.checkAuthStatus()
  }

  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: loginMutation.isPending || signupMutation.isPending,
    login,
    signup,
    logout,
    checkAuth,
    createMockUser: authStore.createMockUser,
    updateUser: authStore.updateUser
  }
}

// Hook for protected routes
export const useRequireAuth = () => {
  const { isAuthenticated, checkAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      // Verify token is still valid
      const isValid = await checkAuth()
      if (!isValid) {
        navigate('/login')
      }
    }

    verifyAuth()
  }, [isAuthenticated, checkAuth, navigate])

  return isAuthenticated
}

// Hook for guest-only routes (login/signup)
export const useGuestOnly = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat')
    }
  }, [isAuthenticated, navigate])

  return !isAuthenticated
}
