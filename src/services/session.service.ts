import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';
import type {
  FocusSession,
  CreateSessionRequest,
  SessionStats,
  GetSessionsParams,
  GetSessionsResponse,
  GetStatsParams,
  ApiResponse,
} from '../types/api';

class SessionService {
  /**
   * 獲取專注紀錄列表
   */
  async getSessions(params?: GetSessionsParams): Promise<ApiResponse<GetSessionsResponse>> {
    return httpClient.get<GetSessionsResponse>(API_ENDPOINTS.SESSIONS.BASE, params);
  }

  /**
   * 創建專注紀錄
   */
  async createSession(data: CreateSessionRequest): Promise<ApiResponse<FocusSession>> {
    return httpClient.post<FocusSession>(API_ENDPOINTS.SESSIONS.BASE, data);
  }

  /**
   * 獲取統計數據
   */
  async getStats(params?: GetStatsParams): Promise<ApiResponse<SessionStats>> {
    return httpClient.get<SessionStats>(API_ENDPOINTS.SESSIONS.STATS, params);
  }
}

export const sessionService = new SessionService();
