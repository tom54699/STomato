import { httpClient } from './http.client';
import { API_ENDPOINTS, STORAGE_KEYS } from './api.config';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
} from '../types/api';

class AuthService {
  /**
   * 用戶註冊
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      false // 註冊不需要認證
    );

    if (response.success && response.data) {
      this.saveAuthData(response.data);
    }

    return response;
  }

  /**
   * 用戶登入
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data,
      false // 登入不需要認證
    );

    if (response.success && response.data) {
      this.saveAuthData(response.data);
    }

    return response;
  }

  /**
   * 登出
   */
  async logout(): Promise<ApiResponse<null>> {
    const response = await httpClient.post<null>(API_ENDPOINTS.AUTH.LOGOUT);

    // 無論成功與否都清除本地資料
    this.clearAuthData();

    return response;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      return {
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: '沒有刷新 token',
        },
      };
    }

    const response = await httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken },
      false
    );

    if (response.success && response.data) {
      this.saveAuthData(response.data);
    }

    return response;
  }

  /**
   * 檢查是否已登入
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * 獲取當前用戶資料
   */
  getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 保存認證資料
   */
  private saveAuthData(authData: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));
  }

  /**
   * 清除認證資料
   */
  private clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export const authService = new AuthService();
