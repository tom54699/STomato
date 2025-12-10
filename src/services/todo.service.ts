import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  ToggleTodoCompleteRequest,
  GetTodosParams,
  ApiResponse,
} from '../types/api';

class TodoService {
  /**
   * 獲取待辦事項列表
   */
  async getTodos(params?: GetTodosParams): Promise<ApiResponse<Todo[]>> {
    return httpClient.get<Todo[]>(API_ENDPOINTS.TODOS.BASE, params);
  }

  /**
   * 獲取單個待辦事項
   */
  async getTodo(id: string): Promise<ApiResponse<Todo>> {
    return httpClient.get<Todo>(API_ENDPOINTS.TODOS.BY_ID(id));
  }

  /**
   * 創建待辦事項
   */
  async createTodo(data: CreateTodoRequest): Promise<ApiResponse<Todo>> {
    return httpClient.post<Todo>(API_ENDPOINTS.TODOS.BASE, data);
  }

  /**
   * 更新待辦事項
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<ApiResponse<Todo>> {
    return httpClient.put<Todo>(API_ENDPOINTS.TODOS.BY_ID(id), data);
  }

  /**
   * 刪除待辦事項
   */
  async deleteTodo(id: string): Promise<ApiResponse<null>> {
    return httpClient.delete<null>(API_ENDPOINTS.TODOS.BY_ID(id));
  }

  /**
   * 切換待辦事項完成狀態
   */
  async toggleComplete(id: string, completed: boolean): Promise<ApiResponse<Todo>> {
    const data: ToggleTodoCompleteRequest = { completed };
    return httpClient.patch<Todo>(API_ENDPOINTS.TODOS.COMPLETE(id), data);
  }
}

export const todoService = new TodoService();
