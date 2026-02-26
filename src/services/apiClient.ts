/**
 * API Client utility for making authenticated requests to the backend.
 * Handles JWT token attachment, token refresh, and comprehensive error handling.
 */

// API base URL - defaults to /api for development proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Custom error classes for different API error types
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  public fieldErrors: Record<string, string[]>;
  
  constructor(data: any) {
    // Extract field errors from response
    const fieldErrors = data?.field_errors || data || {};
    const errorMessage = data?.error || 'Validation failed';
    
    super(errorMessage, 400, data);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
  
  /**
   * Get user-friendly error message for display
   */
  getUserMessage(): string {
    const errors = Object.entries(this.fieldErrors);
    if (errors.length === 0) {
      return this.message;
    }
    
    // Return first error message
    const [field, messages] = errors[0];
    const errorMessages = Array.isArray(messages) ? messages : [messages];
    const fieldName = field === 'non_field_errors' ? '' : `${field}: `;
    return `${fieldName}${errorMessages[0]}`;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends APIError {
  constructor(message: string = 'Permission denied') {
    super(message, 403);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends APIError {
  constructor(message: string = 'Server error occurred') {
    super(message, 500);
    this.name = 'ServerError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Get the stored access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('apas_access_token');
}

/**
 * Get the stored refresh token from localStorage
 */
function getRefreshToken(): string | null {
  return localStorage.getItem('apas_refresh_token');
}

/**
 * Set new access token in localStorage
 */
function setAccessToken(token: string): void {
  localStorage.setItem('apas_access_token', token);
}

/**
 * Clear all auth tokens from localStorage
 */
function clearTokens(): void {
  localStorage.removeItem('apas_access_token');
  localStorage.removeItem('apas_refresh_token');
  localStorage.removeItem('apas_user');
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid or expired
      clearTokens();
      // Redirect to login
      window.location.href = '/login';
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access;
    
    setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearTokens();
    window.location.href = '/login';
    return null;
  }
}

/**
 * Parse error response and create appropriate error object
 */
function parseErrorResponse(status: number, data: any): APIError {
  // Extract error message from various response formats
  let errorMessage = 'An error occurred';
  
  if (typeof data === 'string') {
    errorMessage = data;
  } else if (data?.error) {
    errorMessage = data.error;
  } else if (data?.detail) {
    errorMessage = data.detail;
  } else if (data?.message) {
    errorMessage = data.message;
  }
  
  // Create appropriate error type based on status code
  switch (status) {
    case 400:
      return new ValidationError(data);
    case 401:
      return new AuthenticationError(errorMessage);
    case 403:
      return new PermissionError(errorMessage);
    case 404:
      return new NotFoundError(errorMessage);
    case 500:
    case 502:
    case 503:
      return new ServerError(errorMessage);
    default:
      return new APIError(errorMessage, status, data);
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Get access token
  let accessToken = getAccessToken();
  
  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Attach authorization header if token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    // Make the request
    let response = await fetch(url, {
      ...options,
      headers,
    });
    
    // If 401 Unauthorized, try to refresh token and retry once
    if (response.status === 401 && accessToken) {
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, throw authentication error
        throw new AuthenticationError('Session expired. Please login again.');
      }
    }
    
    // Parse response
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    let data: any;
    
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (parseError) {
      // If response parsing fails, use status text
      data = { error: response.statusText };
    }
    
    // Handle error responses
    if (!response.ok) {
      const error = parseErrorResponse(response.status, data);
      
      // Special handling for 401 - redirect to login
      if (response.status === 401) {
        clearTokens();
        window.location.href = '/login';
      }
      
      throw error;
    }
    
    return data as T;
  } catch (error) {
    // Re-throw API errors
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or fetch errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new NetworkError();
      }
    }
    
    // Unknown error
    console.error('Unexpected error in apiRequest:', error);
    throw new APIError('An unexpected error occurred', 500);
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Helper function to get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.getUserMessage();
  }
  
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
