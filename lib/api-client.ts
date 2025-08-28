const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: any = {}
  
  try {
    // Try to parse JSON response
    const text = await response.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.warn('Response is not valid JSON:', text)
      }
    }

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        data
      })
      
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        ...data,
      }
    }
    
    return { 
      success: true, 
      ...data,
      data: data.data || data
    }
  } catch (error) {
    console.error('Error handling response:', {
      error,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    })
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error processing response',
      details: error
    }
  }
}

async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Add auth token if available
  const token = localStorage.getItem('auth-token') || '';
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Prepare request body
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  const requestId = Math.random().toString(36).substring(2, 9);
  const startTime = Date.now();
  
  console.debug(`[API] ${options.method || 'GET'} ${endpoint}`, {
    requestId,
    headers: Object.fromEntries(headers.entries()),
    body: body ? JSON.parse(body as string) : undefined,
  });

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      body,
      credentials: 'include',
    });

    const responseTime = Date.now() - startTime;
    
    console.debug(`[API] Response ${response.status} ${endpoint} (${responseTime}ms)`, {
      requestId,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return handleResponse<T>(response);
  } catch (error) {
    console.error('API Request Error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Network error occurred',
    }
  }
}

export const apiClient = {
  get: async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return fetchWithAuth<T>(endpoint, { ...options, method: 'GET' });
  },
  
  post: async <T = any>(
    endpoint: string, 
    body?: any, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    return fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body,
    });
  },
  
  put: async <T = any>(
    endpoint: string, 
    body?: any, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    return fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body,
    });
  },
  
  delete: async <T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    return fetchWithAuth<T>(endpoint, { 
      ...options, 
      method: 'DELETE' 
    });
  },
}

export default apiClient