import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';
import type {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  ApiResponse,
} from '../types/api';

class CourseService {
  /**
   * 獲取所有課程
   */
  async getCourses(): Promise<ApiResponse<Course[]>> {
    return httpClient.get<Course[]>(API_ENDPOINTS.COURSES.BASE);
  }

  /**
   * 獲取單個課程
   */
  async getCourse(id: string): Promise<ApiResponse<Course>> {
    return httpClient.get<Course>(API_ENDPOINTS.COURSES.BY_ID(id));
  }

  /**
   * 創建課程
   */
  async createCourse(data: CreateCourseRequest): Promise<ApiResponse<Course>> {
    return httpClient.post<Course>(API_ENDPOINTS.COURSES.BASE, data);
  }

  /**
   * 更新課程
   */
  async updateCourse(id: string, data: UpdateCourseRequest): Promise<ApiResponse<Course>> {
    return httpClient.put<Course>(API_ENDPOINTS.COURSES.BY_ID(id), data);
  }

  /**
   * 刪除課程
   */
  async deleteCourse(id: string): Promise<ApiResponse<null>> {
    return httpClient.delete<null>(API_ENDPOINTS.COURSES.BY_ID(id));
  }
}

export const courseService = new CourseService();
