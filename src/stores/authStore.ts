import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  token: string
  id: string
  email: string
  username: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (userData: User) => void
  logout: () => void
  initializeAuth: () => void
  updateUser: (updates: Partial<User>) => void
  checkAuthStatus: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (userData: User) => {
        const user = {
          token: userData.token,
          id: userData.id,
          email: userData.email,
          username: userData.username || userData.email.split('@')[0]
        }

        console.log('AuthStore: Setting user data:', user)
        console.log('AuthStore: Setting isAuthenticated to true')

        set({ user, isAuthenticated: true })

        console.log('AuthStore: User logged in successfully:', user)

        // Store authToken separately for API utility compatibility
        localStorage.setItem('authToken', userData.token)

        console.log('AuthStore: Auth token stored in localStorage')
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })

        // Clear authToken from localStorage (Zustand persist will handle the rest)
        localStorage.removeItem('authToken')

        console.log('User logged out')
      },

      // Removed initializeAuth - Zustand persist middleware handles initialization automatically



      updateUser: (updates: Partial<User>) => {
        set(state => {
          if (!state.user) return state
          const updatedUser = { ...state.user, ...updates }

          // Zustand persist middleware will handle localStorage automatically

          return { user: updatedUser }
        })
      },

      checkAuthStatus: async () => {
        const { user } = get()
        if (!user?.token) return false

        try {
          // Verify token with backend
          const formData = new FormData()
          formData.append('token', user.token)
          formData.append('mode', 'check')

          const response = await fetch('/user/account', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const result = await response.json()
            return result.success === true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
