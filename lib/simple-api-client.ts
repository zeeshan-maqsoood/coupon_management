// Simple API client without authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Something went wrong',
        ...data,
      };
    }
    return { success: true, ...data };
  } catch (error) {
    console.error('Error parsing response:', error);
    return {
      success: false,
      error: 'Error parsing server response',
    };
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  
  // Set JSON content-type for request bodies
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    return handleResponse<T>(response);
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error - could not connect to the server',
    };
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
    
  put: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
    
  delete: <T = any>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
