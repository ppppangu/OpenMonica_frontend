// API utility functions for handling authenticated requests
import { useAuthStore } from '../stores/authStore'

/**
 * Get the authentication token from localStorage or auth store
 */
export function getAuthToken(): string | null {
  // First try localStorage (for compatibility)
  const tokenFromStorage = localStorage.getItem('authToken')
  if (tokenFromStorage) {
    return tokenFromStorage
  }

  // Fallback to auth store
  try {
    const { user } = useAuthStore.getState()
    return user?.token || null
  } catch (error) {
    console.warn('Could not access auth store:', error)
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
    const { logout } = useAuthStore.getState()
    logout()

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
 * Handle API response and extract data
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const rawText = await response.text()

    // 尝试从 JSON 中提取 message 字段
    let friendlyMsg = rawText
    try {
      const parsed = JSON.parse(rawText)
      if (parsed && typeof parsed.message === 'string') {
        friendlyMsg = parsed.message
      }
    } catch {
      /* rawText 不是 JSON，保持原样 */
    }

    throw new Error(`API Error: ${response.status} ${response.statusText} - ${friendlyMsg}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    // 若后端返回 204 或 Content-Length 为 0，直接返回 undefined
    const rawText = await response.text()

    if (!rawText) {
      // 空响应体
      return undefined as any
    }

    try {
      return JSON.parse(rawText) as any
    } catch (err) {
      // 非法 JSON 时回退为纯文本
      console.warn('JSON 解析失败，回退为文本:', err)
      return rawText as any
    }
  }

  return response.text() as any
}

/**
 * API request wrapper with error handling
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await authenticatedFetch(url, options)
    return await handleApiResponse<T>(response)
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
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

// ==================== 用户账户管理 API ====================

/**
 * 获取用户信息
 * @param target - 要获取的信息类型 ('username' | 'email')
 * @param userId - 用户ID
 */
export async function getUserInfo(target: 'username' | 'email', userId: string): Promise<string> {
  const response = await authenticatedFormPost('/user/account', {
    mode: 'get',
    target,
    user_id: userId
  })

  const result = await handleApiResponse<{ status: string; message: string; data: string }>(response)

  if (result.status === 'success') {
    return result.data
  } else {
    throw new Error(result.message || '获取用户信息失败')
  }
}

/**
 * 更新用户信息
 * @param target - 要更新的信息类型 ('username' | 'email' | 'password')
 * @param newValue - 新值
 * @param userId - 用户ID
 */
export async function updateUserInfo(
  target: 'username' | 'email' | 'password',
  newValue: string,
  userId: string
): Promise<void> {
  const response = await authenticatedFormPost('/user/account', {
    mode: 'update',
    target,
    new_value: newValue,
    user_id: userId
  })

  const result = await handleApiResponse<{ status?: string; success?: boolean; message?: string } | string | undefined>(response)

  // =====================
  // 统一成功判断逻辑
  // =====================
  let isSuccess = false

  if (result === undefined) {
    // 204 No Content 或空响应体视为成功
    isSuccess = true
  } else if (typeof result === 'string') {
    // 处理纯文本 "success" / "ok" / "updated" 等
    const lower = result.trim().toLowerCase()
    isSuccess = ['success', 'ok', 'updated', 'done'].includes(lower) || lower.startsWith('update success')
  } else if (typeof result === 'object' && result !== null) {
    const statusStr = typeof (result as any).status === 'string' ? (result as any).status.toLowerCase() : ''
    const messageStr = typeof (result as any).message === 'string' ? (result as any).message : ''
    isSuccess =
      statusStr === 'success' ||
      (result as any).success === true ||
      /更新成功|success|ok/i.test(messageStr)
  }

  if (!isSuccess) {
    const errMsg = typeof result === 'string' ? result : result?.message || '更新用户信息失败'
    throw new Error(errMsg)
  }
}

/**
 * 注销用户账户
 * @param userId - 用户ID
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const response = await authenticatedFormPost('/user/account', {
    mode: 'delete',
    user_id: userId
  })

  const result = await handleApiResponse<{ status: string; message: string }>(response)

  if (result.status !== 'success') {
    throw new Error(result.message || '账号注销失败')
  }
}
