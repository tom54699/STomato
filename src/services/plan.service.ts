import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';
import type {
  StudyPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  TogglePlanCompleteRequest,
  GetPlansParams,
  ApiResponse,
} from '../types/api';

class PlanService {
  /**
   * 獲取學習計畫列表
   */
  async getPlans(params?: GetPlansParams): Promise<ApiResponse<StudyPlan[]>> {
    return httpClient.get<StudyPlan[]>(API_ENDPOINTS.PLANS.BASE, params);
  }

  /**
   * 獲取單個學習計畫
   */
  async getPlan(id: string): Promise<ApiResponse<StudyPlan>> {
    return httpClient.get<StudyPlan>(API_ENDPOINTS.PLANS.BY_ID(id));
  }

  /**
   * 創建學習計畫
   */
  async createPlan(data: CreatePlanRequest): Promise<ApiResponse<StudyPlan>> {
    return httpClient.post<StudyPlan>(API_ENDPOINTS.PLANS.BASE, data);
  }

  /**
   * 更新學習計畫
   */
  async updatePlan(id: string, data: UpdatePlanRequest): Promise<ApiResponse<StudyPlan>> {
    return httpClient.put<StudyPlan>(API_ENDPOINTS.PLANS.BY_ID(id), data);
  }

  /**
   * 刪除學習計畫
   */
  async deletePlan(id: string): Promise<ApiResponse<null>> {
    return httpClient.delete<null>(API_ENDPOINTS.PLANS.BY_ID(id));
  }

  /**
   * 切換計畫完成狀態
   */
  async toggleComplete(id: string, completed: boolean): Promise<ApiResponse<StudyPlan>> {
    const data: TogglePlanCompleteRequest = { completed };
    return httpClient.patch<StudyPlan>(API_ENDPOINTS.PLANS.COMPLETE(id), data);
  }
}

export const planService = new PlanService();
