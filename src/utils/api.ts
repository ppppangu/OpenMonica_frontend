// API utility functions for handling authenticated requests
import { useUserStore } from '../store/user_info'

/**
 * Get the authentication token from localStorage or Pinia store
 */
export function getAuthToken(): string | null {
  // First try localStorage (for compatibility)
  const tokenFromStorage = localStorage.getItem('authToken')
  if (tokenFromStorage) {
    return tokenFromStorage
  }

  // Fallback to Pinia store
  try {
    const userStore = useUserStore()
    return userStore.user?.token || null
  } catch (error) {
    console.warn('Could not access user store:', error)
    return null
  }
}

/**
 * Create headers with authentication token (for JSON requests)
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Create FormData with authentication token (for server.js endpoints)
 */
export function createAuthFormData(additionalData: Record<string, any> = {}): FormData {
  const token = getAuthToken()
  const formData = new FormData()

  if (token) {
    formData.append('token', token)
  }

  // Add additional data to FormData
  Object.entries(additionalData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  })

  return formData
}

/**
 * Authenticated fetch wrapper
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = createAuthHeaders(options.headers as Record<string, string>)
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    // Clear stored authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    
    // Redirect to login page
    window.location.href = '/login'
    throw new Error('Authentication failed')
  }
  
  return response
}

/**
 * Authenticated POST request with JSON body
 */
export async function authenticatedPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Authenticated POST request with FormData (for server.js endpoints)
 */
export async function authenticatedFormPost(url: string, data: Record<string, any> = {}): Promise<Response> {
  const formData = createAuthFormData(data)

  return fetch(url, {
    method: 'POST',
    body: formData
  })
}

/**
 * Authenticated GET request
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'GET'
  })
}

/**
 * Check if user is authenticated by verifying token
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken()
  const user = localStorage.getItem('user')
  const authFlag = localStorage.getItem('isAuthenticated')
  
  return !!(token && user && authFlag === 'true')
}
