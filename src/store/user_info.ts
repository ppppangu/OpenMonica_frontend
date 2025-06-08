import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  token: string
  id: string
  email: string
  username: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)

  // Getters
  const isLoggedIn = computed(() => isAuthenticated.value && user.value !== null)
  const userName = computed(() => user.value?.username || '')
  const userEmail = computed(() => user.value?.email || '')

  // Actions
  function login(userData: User) {
    user.value = {
      token: userData.token,
      id: userData.id,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0]
    }
    isAuthenticated.value = true

    console.log('User logged in:', user.value)

    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('isAuthenticated', 'true')
  }

  async function logout() {
    user.value = null
    isAuthenticated.value = false

    // Clear localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')

    // Call logout API to clear server-side token (if implemented)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include cookies
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
  }

  async function initializeFromStorage() {
    console.log('Initializing user store from storage...')

    // First try to restore from localStorage
    try {
      const storedUser = localStorage.getItem('user')
      const storedAuth = localStorage.getItem('isAuthenticated')

      console.log('Stored user:', storedUser)
      console.log('Stored auth:', storedAuth)

      if (storedUser && storedAuth === 'true') {
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
        console.log('User session restored from localStorage:', user.value)
        return
      }

      // 如果没有存储的用户信息，创建一个测试用户（仅用于开发调试）
      console.log('No stored user found, creating mock user for development...')
      const mockUser = {
        token: 'mock_token_' + Date.now(),
        id: 'mock_user_' + Date.now(),
        email: 'test@example.com',
        username: 'testuser'
      }

      login(mockUser)
      console.log('Mock user created for development:', mockUser)

    } catch (error) {
      console.error('Failed to restore from localStorage:', error)
    }
  }

  function updateUser(userData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    // State
    user,
    isAuthenticated,

    // Getters
    isLoggedIn,
    userName,
    userEmail,

    // Actions
    login,
    logout,
    initializeFromStorage,
    updateUser
  }
})
