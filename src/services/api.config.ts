// API 配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  API_VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
};

export const API_ENDPOINTS = {
  // 認證
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
  },
  // 課程
  COURSES: {
    BASE: '/api/v1/courses',
    BY_ID: (id: string) => `/api/v1/courses/${id}`,
  },
  // 學習計畫
  PLANS: {
    BASE: '/api/v1/plans',
    BY_ID: (id: string) => `/api/v1/plans/${id}`,
    COMPLETE: (id: string) => `/api/v1/plans/${id}/complete`,
  },
  // 專注紀錄
  SESSIONS: {
    BASE: '/api/v1/sessions',
    STATS: '/api/v1/sessions/stats',
  },
  // 待辦事項
  TODOS: {
    BASE: '/api/v1/todos',
    BY_ID: (id: string) => `/api/v1/todos/${id}`,
    COMPLETE: (id: string) => `/api/v1/todos/${id}/complete`,
  },
};

// Token 存儲 key
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'currentUser',
};
