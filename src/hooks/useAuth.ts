import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLoginMutation, useSignupMutation } from './useApi'

export const useAuth = () => {
  const authStore = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useLoginMutation()
  const signupMutation = useSignupMutation()

  // Zustand persist middleware handles initialization automatically
  // No need for manual initialization

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await loginMutation.mutateAsync(credentials)

      console.log('Login API result:', result) // 调试日志

      if (result.success && result.token) {
        const userData = {
          token: result.token,
          id: result.user_id || result.id, // 后端返回user_id字段
          email: result.user_email || credentials.email, // 后端返回user_email字段
          username: result.user_username || result.username || credentials.email.split('@')[0] // 后端返回user_username字段
        }

        console.log('Processed user data:', userData) // 调试日志

        // Update auth store
        authStore.login(userData)

        console.log('Auth store updated, current state:', {
          isAuthenticated: authStore.isAuthenticated,
          user: authStore.user
        })

        // Force a state update and navigation
        // Use a longer timeout to ensure Zustand state has propagated
        setTimeout(() => {
          console.log('Attempting navigation to /chat')
          navigate('/chat', { replace: true })
        }, 200)

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
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('useGuestOnly: isAuthenticated changed to:', isAuthenticated, 'user:', user)

    // Check both isAuthenticated flag and user object existence
    if (isAuthenticated && user && user.token) {
      console.log('useGuestOnly: User is authenticated with token, redirecting to /chat')
      // Use setTimeout to ensure the redirect happens after any pending state updates
      setTimeout(() => {
        navigate('/chat', { replace: true })
      }, 100)
    }
  }, [isAuthenticated, user, navigate])

  return !isAuthenticated || !user
}
