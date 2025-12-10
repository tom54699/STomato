# Tomato 前後端對接指南

## 目錄
- [概述](#概述)
- [快速開始](#快速開始)
- [API 服務層架構](#api-服務層架構)
- [使用示例](#使用示例)
- [資料類型映射](#資料類型映射)
- [錯誤處理](#錯誤處理)
- [注意事項](#注意事項)

---

## 概述

本文檔說明如何將 Tomato React 前端與 Go 後端 API 進行對接。

### 已完成的工作

✅ **API 服務層** (`src/services/`)
- HTTP 客戶端（自動處理 Token 刷新）
- 認證服務
- 課程服務
- 學習計畫服務
- 專注紀錄服務
- 待辦事項服務

✅ **TypeScript 類型定義** (`src/types/api.ts`)
- 所有 API 請求/回應類型
- 與後端資料模型完全對應

---

## 快速開始

### 1. 啟動後端

```bash
cd tomato-backend

# 確保 PostgreSQL 正在運行
brew services start postgresql@15

# 創建資料庫（第一次）
psql -U postgres -c "CREATE DATABASE tomato_db;"

# 配置環境變數
cp .env.example .env
# 編輯 .env 設置資料庫密碼和 JWT 密鑰

# 啟動後端
go run cmd/server/main.go
```

後端將在 `http://localhost:8080` 運行

### 2. 配置前端

```bash
cd tomato

# 創建環境變數文件
echo "VITE_API_URL=http://localhost:8080" > .env.development

# 啟動前端（應該已經在運行）
npm run dev
```

前端將在 `http://localhost:5173` 或 `http://localhost:3000` 運行

---

## API 服務層架構

### 文件結構

```
src/
├── services/
│   ├── index.ts              # 統一導出
│   ├── api.config.ts         # API 配置
│   ├── http.client.ts        # HTTP 客戶端
│   ├── auth.service.ts       # 認證服務
│   ├── course.service.ts     # 課程服務
│   ├── plan.service.ts       # 學習計畫服務
│   ├── session.service.ts    # 專注紀錄服務
│   └── todo.service.ts       # 待辦事項服務
└── types/
    └── api.ts                # API 類型定義
```

### HTTP 客戶端特性

- ✅ **自動 Token 管理** - 自動添加 Authorization header
- ✅ **Token 自動刷新** - 401 錯誤時自動刷新 token
- ✅ **統一錯誤處理** - 統一的錯誤回應格式
- ✅ **TypeScript 類型安全** - 完整的類型定義

---

## 使用示例

### 1. 認證（Login 組件）

#### 原本的做法（localStorage）
```typescript
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  // 驗證邏輯...
  const user = {
    id: '123',
    name: form.name,
    email: form.email,
    school: form.school,
    totalPoints: 0,
  };
  localStorage.setItem('currentUser', JSON.stringify(user));
  onLogin(user);
};
```

#### 新的做法（使用 API）
```typescript
import { authService } from '../services';

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await authService.login({
      email: form.email,
      password: form.password,
    });

    if (response.success && response.data) {
      // authService 已自動保存 token 和用戶資料
      onLogin({
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        school: response.data.user.school?.name || '',
        totalPoints: response.data.user.total_points,
      });
    } else {
      setError(response.error?.message || '登入失敗');
    }
  } catch (error) {
    setError('網路錯誤，請稍後再試');
  } finally {
    setLoading(false);
  }
};
```

#### 註冊
```typescript
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  const response = await authService.register({
    email: form.email,
    password: form.password,
    name: form.name,
    school_name: form.school,
  });

  if (response.success && response.data) {
    onLogin({
      id: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email,
      school: response.data.user.school?.name || '',
      totalPoints: response.data.user.total_points,
    });
  }
};
```

### 2. 課程管理（Schedule 組件）

#### 獲取課程列表
```typescript
import { courseService } from '../services';
import type { Course } from '../types/api';

const [courses, setCourses] = useState<Course[]>([]);

useEffect(() => {
  const loadCourses = async () => {
    const response = await courseService.getCourses();
    if (response.success && response.data) {
      setCourses(response.data);
    }
  };
  loadCourses();
}, []);
```

#### 創建課程
```typescript
const handleCreateCourse = async (courseData) => {
  const response = await courseService.createCourse({
    name: courseData.name,
    color: courseData.color,
    credits: courseData.credits,
    start_date: courseData.startDate,
    end_date: courseData.endDate,
    day_of_week: courseData.dayOfWeek, // 0-6
    start_time: courseData.startTime,   // "09:00"
    end_time: courseData.endTime,       // "11:00"
    location: courseData.location,
    professor_name: courseData.professorName,
  });

  if (response.success && response.data) {
    setCourses([...courses, response.data]);
  }
};
```

#### 更新課程
```typescript
const handleUpdateCourse = async (id: string, updates) => {
  const response = await courseService.updateCourse(id, updates);

  if (response.success && response.data) {
    setCourses(courses.map(c =>
      c.id === id ? response.data! : c
    ));
  }
};
```

#### 刪除課程
```typescript
const handleDeleteCourse = async (id: string) => {
  const response = await courseService.deleteCourse(id);

  if (response.success) {
    setCourses(courses.filter(c => c.id !== id));
  }
};
```

### 3. 學習計畫（StudyPlanner 組件）

#### 獲取今日計畫
```typescript
import { planService } from '../services';

const loadTodayPlans = async () => {
  const today = new Date().toISOString().split('T')[0];

  const response = await planService.getPlans({
    date: today,
  });

  if (response.success && response.data) {
    setPlans(response.data);
  }
};
```

#### 創建計畫
```typescript
const handleCreatePlan = async (planData) => {
  const response = await planService.createPlan({
    title: planData.title,
    course_id: planData.courseId, // 可選
    date: planData.date,
    start_time: planData.startTime,
    target_minutes: planData.targetMinutes,
    location: planData.location,
    notes: planData.notes,
  });

  if (response.success && response.data) {
    setPlans([...plans, response.data]);
  }
};
```

#### 標記計畫完成
```typescript
const togglePlanComplete = async (planId: string, completed: boolean) => {
  const response = await planService.toggleComplete(planId, completed);

  if (response.success && response.data) {
    setPlans(plans.map(p =>
      p.id === planId ? response.data! : p
    ));
  }
};
```

### 4. 專注紀錄（Home 組件）

#### 創建專注紀錄（完成番茄鐘）
```typescript
import { sessionService } from '../services';

const handleFinishPomodoro = async (minutes: number, planId?: string) => {
  const response = await sessionService.createSession({
    plan_id: planId,
    course_id: selectedCourseId,
    date: new Date().toISOString().split('T')[0],
    minutes: minutes,
    location: '圖書館',
  });

  if (response.success && response.data) {
    // 專注紀錄已創建
    // 後端會自動更新：
    // - 用戶總積分
    // - 學校總積分
    // - 計畫進度
    // - 計畫完成狀態（如果達到目標）

    const pointsEarned = response.data.points_earned;

    // 更新本地用戶積分
    updateUserPoints(pointsEarned);

    // 顯示結算頁面
    goToSettlement({
      sessionMinutes: minutes,
      pointsEarned: pointsEarned,
      planTitle: planTitle,
      planId: planId,
    });
  }
};
```

#### 獲取統計數據（Insights 組件）
```typescript
const loadStats = async (period: 'week' | 'month' | 'year' | 'lifetime') => {
  const response = await sessionService.getStats({ period });

  if (response.success && response.data) {
    const stats = response.data;
    console.log('總番茄鐘數:', stats.total_sessions);
    console.log('總專注分鐘:', stats.total_minutes);
    console.log('總積分:', stats.total_points);
    console.log('活躍天數:', stats.active_days);
    console.log('當前連續天數:', stats.current_streak);
    console.log('每日分解:', stats.daily_breakdown);
    console.log('課程分布:', stats.course_breakdown);
  }
};
```

### 5. 待辦事項

#### 獲取待辦列表
```typescript
import { todoService } from '../services';
import type { TodoType } from '../types/api';

const loadTodos = async () => {
  const response = await todoService.getTodos({
    date: today,
    type: 'homework', // 可選：homework, exam, memo
    completed: false,  // 可選
  });

  if (response.success && response.data) {
    setTodos(response.data);
  }
};
```

#### 創建待辦
```typescript
const handleCreateTodo = async (todoData) => {
  const response = await todoService.createTodo({
    title: todoData.title,
    course_id: todoData.courseId, // 可選
    date: todoData.date,
    todo_type: todoData.type as TodoType, // 'homework' | 'exam' | 'memo'
  });

  if (response.success && response.data) {
    setTodos([...todos, response.data]);
  }
};
```

#### 切換完成狀態
```typescript
const toggleTodoComplete = async (todoId: string, completed: boolean) => {
  const response = await todoService.toggleComplete(todoId, completed);

  if (response.success && response.data) {
    setTodos(todos.map(t =>
      t.id === todoId ? response.data! : t
    ));
  }
};
```

---

## 資料類型映射

### 前端 localStorage → 後端 API

| 前端欄位 | 後端欄位 | 說明 |
|---------|---------|------|
| `id` | `id` | UUID 字串 |
| `name` | `name` | 用戶名稱 |
| `email` | `email` | 電子郵件 |
| `school` | `school.name` | 學校名稱 |
| `totalPoints` | `total_points` | 總積分 |

### 日期格式

- 前端：使用 `YYYY-MM-DD` 格式
- 後端：接受 `YYYY-MM-DD` 格式
- 時間：使用 `HH:MM` 格式（24小時制）

### 星期對應

```typescript
// day_of_week 映射
0: '日',
1: '一',
2: '二',
3: '三',
4: '四',
5: '五',
6: '六',
```

---

## 錯誤處理

### API 回應格式

```typescript
// 成功
{
  success: true,
  data: { ... },
  message: "操作成功"
}

// 失敗
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "請求參數驗證失敗",
    details: { ... }
  }
}
```

### 常見錯誤碼

| 錯誤碼 | 說明 | 處理方式 |
|-------|------|---------|
| `VALIDATION_ERROR` | 參數驗證失敗 | 顯示錯誤訊息給用戶 |
| `UNAUTHORIZED` | 未認證或 token 過期 | 自動刷新 token 或跳轉登入 |
| `NOT_FOUND` | 資源不存在 | 提示用戶資源不存在 |
| `CONFLICT` | 資源衝突（如重複 email） | 提示用戶修改 |
| `INTERNAL_ERROR` | 伺服器錯誤 | 提示用戶稍後再試 |
| `NETWORK_ERROR` | 網路錯誤 | 提示用戶檢查網路連接 |

### 錯誤處理示例

```typescript
const handleApiCall = async () => {
  try {
    const response = await someService.someMethod();

    if (response.success) {
      // 成功處理
      console.log(response.data);
    } else {
      // 錯誤處理
      const errorMessage = response.error?.message || '操作失敗';
      alert(errorMessage);

      // 根據錯誤碼特殊處理
      if (response.error?.code === 'UNAUTHORIZED') {
        // 已自動處理，但可以顯示訊息
        console.log('請重新登入');
      }
    }
  } catch (error) {
    // 捕獲異常（通常不會到這裡，因為 httpClient 已處理）
    console.error('Unexpected error:', error);
    alert('發生未預期的錯誤');
  }
};
```

---

## 注意事項

### 1. Token 自動刷新

HTTP 客戶端會自動處理 token 刷新：
- 當收到 401 錯誤時，自動使用 refresh_token 刷新
- 刷新成功後，重試原請求
- 刷新失敗後，清除認證資料並跳轉登入頁

### 2. 用戶資料同步

用戶積分更新：
```typescript
// 創建專注紀錄後，後端會自動更新用戶積分
// 前端需要同步更新本地用戶資料

const response = await sessionService.createSession({ ... });

if (response.success && response.data) {
  // 更新本地用戶積分
  const user = authService.getCurrentUser();
  if (user) {
    user.total_points += response.data.points_earned;
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
  }
}
```

### 3. 資料加載狀態

建議在組件中管理加載狀態：

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const loadData = async () => {
  setLoading(true);
  setError('');

  try {
    const response = await someService.getData();
    if (response.success) {
      setData(response.data);
    } else {
      setError(response.error?.message || '加載失敗');
    }
  } finally {
    setLoading(false);
  }
};
```

### 4. 開發模式 vs 生產模式

```typescript
// 開發環境 (.env.development)
VITE_API_URL=http://localhost:8080

// 生產環境 (.env.production)
VITE_API_URL=https://api.yourdomain.com
```

---

## 下一步

1. ✅ API 服務層已建立
2. ⏳ 更新 Login 組件使用真實 API
3. ⏳ 更新其他組件逐步對接 API
4. ⏳ 測試完整的使用者流程
5. ⏳ 處理邊界情況和錯誤

---

**最後更新**: 2025-12-10
