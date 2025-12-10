// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

// 用戶相關類型
export interface User {
  id: string;
  email: string;
  name: string;
  school_id?: string;
  school?: School;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// 認證相關類型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  school_name: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// 課程相關類型
export interface Course {
  id: string;
  user_id: string;
  name: string;
  color: string;
  credits: number;
  start_date: string;
  end_date: string;
  day_of_week: number; // 0-6 (日-六)
  start_time: string;
  end_time: string;
  location?: string;
  professor_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseRequest {
  name: string;
  color: string;
  credits: number;
  start_date: string;
  end_date?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string;
  professor_name?: string;
}

export interface UpdateCourseRequest {
  name?: string;
  color?: string;
  credits?: number;
  start_date?: string;
  end_date?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  location?: string;
  professor_name?: string;
}

// 學習計畫相關類型
export interface StudyPlan {
  id: string;
  user_id: string;
  course_id?: string;
  course?: Course;
  title: string;
  date: string;
  start_time?: string;
  target_minutes: number;
  completed_minutes: number;
  pomodoro_count: number;
  completed: boolean;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanRequest {
  title: string;
  course_id?: string;
  date: string;
  start_time?: string;
  target_minutes: number;
  location?: string;
  notes?: string;
}

export interface UpdatePlanRequest {
  title?: string;
  course_id?: string;
  date?: string;
  start_time?: string;
  target_minutes?: number;
  location?: string;
  notes?: string;
}

export interface TogglePlanCompleteRequest {
  completed: boolean;
}

// 專注紀錄相關類型
export interface FocusSession {
  id: string;
  user_id: string;
  plan_id?: string;
  plan?: StudyPlan;
  course_id?: string;
  course?: Course;
  date: string;
  minutes: number;
  points_earned: number;
  location?: string;
  created_at: string;
}

export interface CreateSessionRequest {
  plan_id?: string;
  course_id?: string;
  date: string;
  minutes: number;
  location?: string;
}

export interface SessionStats {
  period: string;
  total_sessions: number;
  total_minutes: number;
  total_points: number;
  active_days: number;
  current_streak: number;
  daily_breakdown: Array<{
    date: string;
    sessions: number;
    minutes: number;
    points: number;
  }>;
  course_breakdown: Array<{
    course_name: string;
    minutes: number;
    percentage: number;
  }>;
}

export interface GetSessionsResponse {
  sessions: FocusSession[];
  total: number;
  limit: number;
  offset: number;
}

// 待辦事項相關類型
export type TodoType = 'homework' | 'exam' | 'memo';

export interface Todo {
  id: string;
  user_id: string;
  course_id?: string;
  course?: Course;
  title: string;
  date: string;
  todo_type: TodoType;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  course_id?: string;
  date: string;
  todo_type: TodoType;
}

export interface UpdateTodoRequest {
  title?: string;
  course_id?: string;
  date?: string;
  todo_type?: TodoType;
}

export interface ToggleTodoCompleteRequest {
  completed: boolean;
}

// 查詢參數類型
export interface GetPlansParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  completed?: boolean;
}

export interface GetSessionsParams {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

export interface GetTodosParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  completed?: boolean;
  type?: TodoType;
}

export interface GetStatsParams {
  period?: 'week' | 'month' | 'year' | 'lifetime';
}
