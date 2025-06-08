// API utility functions for handling authenticated requests

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

/**
 * Create headers with authentication token
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
