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
  createMockUser: () => User
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
        
        set({ user, isAuthenticated: true })
        
        console.log('User logged in:', user)
        
        // Store in localStorage for API utility compatibility
        localStorage.setItem('authToken', userData.token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('isAuthenticated', 'true')
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
        
        // Clear localStorage
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        localStorage.removeItem('isAuthenticated')
        
        console.log('User logged out')
      },

      initializeAuth: () => {
        try {
          const storedUser = localStorage.getItem('user')
          const storedAuth = localStorage.getItem('isAuthenticated')

          console.log('Stored user:', storedUser)
          console.log('Stored auth:', storedAuth)

          if (storedUser && storedAuth === 'true') {
            const user = JSON.parse(storedUser)
            set({ user, isAuthenticated: true })
            console.log('User session restored from localStorage:', user)
            return
          }

          // For production, don't create mock user automatically
          console.log('No stored user found')
        } catch (error) {
          console.error('Error initializing auth:', error)
          get().logout()
        }
      },

      // Development helper to create mock user
      createMockUser: () => {
        const mockUser = {
          token: 'mock_token_' + Date.now(),
          id: 'mock_user_' + Date.now(),
          email: 'test@example.com',
          username: 'testuser'
        }
        get().login(mockUser)
        console.log('Mock user created for development:', mockUser)
        return mockUser
      },

      updateUser: (updates: Partial<User>) => {
        set(state => {
          if (!state.user) return state
          const updatedUser = { ...state.user, ...updates }

          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser))

          return { user: updatedUser }
        })
      },

      checkAuthStatus: async () => {
        const { user } = get()
        if (!user?.token) return false

        try {
          // Verify token with backend
          const response = await fetch('/user/account', {
            method: 'POST',
            body: new FormData().append('token', user.token).append('mode', 'check')
          })

          if (response.ok) {
            return true
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
