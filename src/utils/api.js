// API utility functions for handling authenticated requests
/**
 * Get the authentication token from localStorage
 */
export function getAuthToken() {
    return localStorage.getItem('authToken');
}
/**
 * Create headers with authentication token
 */
export function createAuthHeaders(additionalHeaders = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...additionalHeaders
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
/**
 * Authenticated fetch wrapper
 */
export async function authenticatedFetch(url, options = {}) {
    const headers = createAuthHeaders(options.headers);
    const response = await fetch(url, {
        ...options,
        headers
    });
    // Handle 401 Unauthorized responses
    if (response.status === 401) {
        // Clear stored authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        // Redirect to login page
        window.location.href = '/login';
        throw new Error('Authentication failed');
    }
    return response;
}
/**
 * Authenticated POST request with JSON body
 */
export async function authenticatedPost(url, data) {
    return authenticatedFetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
/**
 * Authenticated GET request
 */
export async function authenticatedGet(url) {
    return authenticatedFetch(url, {
        method: 'GET'
    });
}
/**
 * Check if user is authenticated by verifying token
 */
export function isAuthenticated() {
    const token = getAuthToken();
    const user = localStorage.getItem('user');
    const authFlag = localStorage.getItem('isAuthenticated');
    return !!(token && user && authFlag === 'true');
}
