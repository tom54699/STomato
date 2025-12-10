import { API_CONFIG, STORAGE_KEYS } from './api.config';
import type { ApiResponse } from '../types/api';

class HttpClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        // 如果是 401 錯誤，嘗試刷新 token
        if (response.status === 401) {
          const refreshed = await this.tryRefreshToken();
          if (!refreshed) {
            // Token 刷新失敗，清除登入狀態
            this.clearAuth();
            window.location.href = '/';
          }
        }

        return data as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      data: null as any,
    };
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.access_token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refresh_token);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  async get<T>(url: string, params?: Record<string, any>, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';

      const response = await fetch(`${this.baseURL}${url}${queryString}`, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('GET request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網路錯誤',
        },
      };
    }
  }

  async post<T>(url: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('POST request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網路錯誤',
        },
      };
    }
  }

  async put<T>(url: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('PUT request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網路錯誤',
        },
      };
    }
  }

  async patch<T>(url: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PATCH',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('PATCH request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網路錯誤',
        },
      };
    }
  }

  async delete<T>(url: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('DELETE request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網路錯誤',
        },
      };
    }
  }
}

export const httpClient = new HttpClient();
