import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
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
      id: userData.id,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0]
    }
    isAuthenticated.value = true
    
    console.log(user.value)

    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('isAuthenticated', 'true')
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    
    // Clear localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }

  function initializeFromStorage() {
    const storedUser = localStorage.getItem('user')
    const storedAuth = localStorage.getItem('isAuthenticated')
    
    if (storedUser && storedAuth === 'true') {
      try {
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        logout()
      }
    }
  }

  function updateUser(userData: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...userData }
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
