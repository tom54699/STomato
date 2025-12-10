# API 設計文檔

版本: v1
基礎路徑: `/api/v1`

## 通用規範

### 請求格式
- Content-Type: `application/json`
- 需要認證的端點：Header 包含 `Authorization: Bearer <token>`

### 回應格式

**成功回應**:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息",
    "details": []
  }
}
```

### HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 創建成功 |
| 400 | 請求參數錯誤 |
| 401 | 未認證 |
| 403 | 無權限 |
| 404 | 資源不存在 |
| 409 | 資源衝突 |
| 500 | 伺服器錯誤 |

### 錯誤碼

| 錯誤碼 | 說明 |
|--------|------|
| VALIDATION_ERROR | 驗證失敗 |
| UNAUTHORIZED | 未認證 |
| FORBIDDEN | 無權限 |
| NOT_FOUND | 資源不存在 |
| CONFLICT | 資源衝突 |
| INTERNAL_ERROR | 伺服器錯誤 |

---

## 1. 認證相關 API

### 1.1 用戶註冊

**端點**: `POST /auth/register`

**請求**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "張三",
  "school_name": "台灣大學"
}
```

**回應** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "張三",
      "school": {
        "id": "uuid",
        "name": "台灣大學"
      },
      "total_points": 0,
      "created_at": "2025-01-01T00:00:00Z"
    },
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here"
  },
  "message": "註冊成功"
}
```

**錯誤**:
- 400: Email 格式錯誤、密碼太短
- 409: Email 已被註冊

---

### 1.2 用戶登入

**端點**: `POST /auth/login`

**請求**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**回應** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "張三",
      "school": {
        "id": "uuid",
        "name": "台灣大學"
      },
      "total_points": 1500
    },
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here"
  },
  "message": "登入成功"
}
```

**錯誤**:
- 400: 請求參數錯誤
- 401: Email 或密碼錯誤

---

### 1.3 刷新 Token

**端點**: `POST /auth/refresh`

**請求**:
```json
{
  "refresh_token": "refresh_token_here"
}
```

**回應** (200):
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  }
}
```

---

### 1.4 登出

**端點**: `POST /auth/logout`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 2. 用戶相關 API

### 2.1 獲取當前用戶資料

**端點**: `GET /users/me`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "張三",
    "school": {
      "id": "uuid",
      "name": "台灣大學",
      "total_points": 150000,
      "student_count": 100
    },
    "total_points": 1500,
    "avatar_url": "https://...",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 2.2 更新用戶資料

**端點**: `PUT /users/me`
**認證**: 必需

**請求**:
```json
{
  "name": "張三三",
  "school_id": "uuid",
  "avatar_url": "https://..."
}
```

**回應** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "張三三",
    "school": { ... },
    "total_points": 1500,
    "avatar_url": "https://...",
    "updated_at": "2025-01-02T00:00:00Z"
  },
  "message": "更新成功"
}
```

---

### 2.3 獲取用戶統計數據

**端點**: `GET /users/me/stats`
**認證**: 必需

**查詢參數**:
- `period`: `week` | `month` | `year` | `lifetime` (預設: month)

**回應** (200):
```json
{
  "success": true,
  "data": {
    "period": "month",
    "total_pomodoros": 45,
    "total_minutes": 1125,
    "total_points": 11250,
    "active_days": 18,
    "total_days": 30,
    "current_streak": 5,
    "longest_streak": 12,
    "daily_breakdown": [
      {
        "date": "2025-01-01",
        "pomodoros": 3,
        "minutes": 75,
        "points": 750
      }
    ],
    "course_breakdown": [
      {
        "course_id": "uuid",
        "course_name": "數學",
        "minutes": 300,
        "percentage": 26.7
      }
    ]
  }
}
```

---

## 3. 課程相關 API

### 3.1 獲取課程列表

**端點**: `GET /courses`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "數學",
      "day": 1,
      "start_time": "09:00:00",
      "end_time": "10:30:00",
      "location": "教室101",
      "color": "bg-blue-400",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3.2 新增課程

**端點**: `POST /courses`
**認證**: 必需

**請求**:
```json
{
  "name": "數學",
  "day": 1,
  "start_time": "09:00",
  "end_time": "10:30",
  "location": "教室101",
  "color": "bg-blue-400"
}
```

**回應** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "數學",
    "day": 1,
    "start_time": "09:00:00",
    "end_time": "10:30:00",
    "location": "教室101",
    "color": "bg-blue-400",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "message": "課程新增成功"
}
```

---

### 3.3 更新課程

**端點**: `PUT /courses/:id`
**認證**: 必需

**請求**:
```json
{
  "name": "進階數學",
  "location": "教室202",
  "color": "bg-purple-400"
}
```

**回應** (200):
```json
{
  "success": true,
  "data": { ... },
  "message": "課程更新成功"
}
```

---

### 3.4 刪除課程

**端點**: `DELETE /courses/:id`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "message": "課程刪除成功"
}
```

---

## 4. 學習計畫相關 API

### 4.1 獲取計畫列表

**端點**: `GET /plans`
**認證**: 必需

**查詢參數**:
- `date`: 特定日期 (YYYY-MM-DD)
- `start_date`: 開始日期
- `end_date`: 結束日期
- `completed`: `true` | `false`

**回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "複習微積分",
      "course": {
        "id": "uuid",
        "name": "數學"
      },
      "date": "2025-01-15",
      "start_time": "19:00:00",
      "end_time": "21:00:00",
      "reminder_time": "18:50:00",
      "location": "圖書館",
      "target_minutes": 120,
      "completed_minutes": 75,
      "pomodoro_count": 3,
      "completed": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 4.2 新增學習計畫

**端點**: `POST /plans`
**認證**: 必需

**請求**:
```json
{
  "title": "複習微積分",
  "course_id": "uuid",
  "date": "2025-01-15",
  "start_time": "19:00",
  "end_time": "21:00",
  "reminder_time": "18:50",
  "location": "圖書館",
  "target_minutes": 120
}
```

**回應** (201):
```json
{
  "success": true,
  "data": { ... },
  "message": "計畫新增成功"
}
```

---

### 4.3 更新學習計畫

**端點**: `PUT /plans/:id`
**認證**: 必需

**請求**:
```json
{
  "title": "複習微積分 - 第三章",
  "target_minutes": 150
}
```

**回應** (200):
```json
{
  "success": true,
  "data": { ... },
  "message": "計畫更新成功"
}
```

---

### 4.4 完成/取消完成計畫

**端點**: `PATCH /plans/:id/complete`
**認證**: 必需

**請求**:
```json
{
  "completed": true
}
```

**回應** (200):
```json
{
  "success": true,
  "data": { ... },
  "message": "計畫狀態已更新"
}
```

---

### 4.5 刪除學習計畫

**端點**: `DELETE /plans/:id`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "message": "計畫刪除成功"
}
```

---

## 5. 專注紀錄相關 API

### 5.1 獲取專注紀錄

**端點**: `GET /sessions`
**認證**: 必需

**查詢參數**:
- `start_date`: 開始日期
- `end_date`: 結束日期
- `limit`: 數量限制 (預設: 50)
- `offset`: 偏移量 (預設: 0)

**回應** (200):
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "plan": {
          "id": "uuid",
          "title": "複習微積分"
        },
        "course": {
          "id": "uuid",
          "name": "數學"
        },
        "date": "2025-01-15",
        "minutes": 25,
        "points_earned": 250,
        "location": "圖書館",
        "created_at": "2025-01-15T19:00:00Z"
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 5.2 新增專注紀錄

**端點**: `POST /sessions`
**認證**: 必需

**請求**:
```json
{
  "plan_id": "uuid",
  "course_id": "uuid",
  "date": "2025-01-15",
  "minutes": 25,
  "location": "圖書館"
}
```

**回應** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plan": { ... },
    "course": { ... },
    "date": "2025-01-15",
    "minutes": 25,
    "points_earned": 250,
    "location": "圖書館",
    "created_at": "2025-01-15T19:00:00Z"
  },
  "message": "專注紀錄新增成功"
}
```

**說明**:
- `points_earned` 會自動計算
- 自動更新用戶總積分
- 如果有 `plan_id`，自動更新計畫進度

---

### 5.3 獲取統計數據

**端點**: `GET /sessions/stats`
**認證**: 必需

**查詢參數**:
- `period`: `week` | `month` | `year` | `lifetime`

**回應** (200):
```json
{
  "success": true,
  "data": {
    "period": "month",
    "total_sessions": 45,
    "total_minutes": 1125,
    "total_points": 11250,
    "active_days": 18,
    "current_streak": 5,
    "daily_chart": [
      {"date": "2025-01-01", "sessions": 3, "minutes": 75},
      ...
    ],
    "course_distribution": [
      {"course_name": "數學", "minutes": 300, "percentage": 26.7},
      ...
    ]
  }
}
```

---

## 6. 待辦事項相關 API

### 6.1 獲取待辦列表

**端點**: `GET /todos`
**認證**: 必需

**查詢參數**:
- `date`: 特定日期
- `start_date`: 開始日期
- `end_date`: 結束日期
- `completed`: `true` | `false`
- `type`: `homework` | `exam` | `memo`

**回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "數學作業 CH3",
      "course": {
        "id": "uuid",
        "name": "數學"
      },
      "date": "2025-01-20",
      "todo_type": "homework",
      "completed": false,
      "created_at": "2025-01-15T00:00:00Z"
    }
  ]
}
```

---

### 6.2 新增待辦

**端點**: `POST /todos`
**認證**: 必需

**請求**:
```json
{
  "title": "數學作業 CH3",
  "course_id": "uuid",
  "date": "2025-01-20",
  "todo_type": "homework"
}
```

**回應** (201):
```json
{
  "success": true,
  "data": { ... },
  "message": "待辦新增成功"
}
```

---

### 6.3 更新待辦

**端點**: `PUT /todos/:id`
**認證**: 必需

**回應** (200)

---

### 6.4 完成/取消完成待辦

**端點**: `PATCH /todos/:id/complete`
**認證**: 必需

**請求**:
```json
{
  "completed": true
}
```

**回應** (200)

---

### 6.5 刪除待辦

**端點**: `DELETE /todos/:id`
**認證**: 必需

**回應** (200)

---

## 7. 排行榜相關 API

### 7.1 學校排行榜

**端點**: `GET /leaderboard/schools`
**認證**: 必需

**查詢參數**:
- `period`: `week` | `month` | `all` (預設: week)
- `limit`: 數量限制 (預設: 100)

**回應** (200):
```json
{
  "success": true,
  "data": {
    "period": "week",
    "schools": [
      {
        "rank": 1,
        "school": {
          "id": "uuid",
          "name": "台灣大學",
          "logo_url": "https://...",
          "student_count": 150
        },
        "points": 125000,
        "avg_points_per_student": 833
      }
    ],
    "my_school_rank": 5
  }
}
```

---

### 7.2 學校詳細排名

**端點**: `GET /leaderboard/schools/:id`
**認證**: 必需

**查詢參數**:
- `period`: `week` | `month` | `all`

**回應** (200):
```json
{
  "success": true,
  "data": {
    "school": {
      "id": "uuid",
      "name": "台灣大學",
      "total_points": 500000,
      "student_count": 150
    },
    "period_stats": {
      "period": "week",
      "rank": 1,
      "points": 125000,
      "avg_points_per_student": 833
    },
    "top_students": [
      {
        "rank": 1,
        "name": "張三",
        "points": 5000
      }
    ]
  }
}
```

---

### 7.3 我的排名

**端點**: `GET /leaderboard/me`
**認證**: 必需

**查詢參數**:
- `period`: `week` | `month` | `all`

**回應** (200):
```json
{
  "success": true,
  "data": {
    "school_rank": 5,
    "within_school_rank": 12,
    "period": "week",
    "my_points": 1250,
    "school_top_points": 5000
  }
}
```

---

## 8. 社交功能相關 API

### 8.1 好友列表

**端點**: `GET /friends`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "friend": {
        "id": "uuid",
        "name": "李四",
        "school": "清華大學",
        "avatar_url": "https://...",
        "total_points": 3000
      },
      "since": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 8.2 發送好友請求

**端點**: `POST /friends/request`
**認證**: 必需

**請求**:
```json
{
  "friend_email": "friend@example.com"
}
```

**回應** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "friend": {
      "id": "uuid",
      "name": "李四",
      "email": "friend@example.com"
    },
    "status": "pending",
    "created_at": "2025-01-15T00:00:00Z"
  },
  "message": "好友請求已發送"
}
```

---

### 8.3 好友請求列表

**端點**: `GET /friends/requests`
**認證**: 必需

**查詢參數**:
- `type`: `sent` | `received` (預設: received)

**回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "from": {
        "id": "uuid",
        "name": "王五",
        "school": "成功大學",
        "avatar_url": "https://..."
      },
      "status": "pending",
      "created_at": "2025-01-14T00:00:00Z"
    }
  ]
}
```

---

### 8.4 接受好友請求

**端點**: `POST /friends/accept/:id`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "message": "已接受好友請求"
}
```

---

### 8.5 拒絕好友請求

**端點**: `POST /friends/reject/:id`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "message": "已拒絕好友請求"
}
```

---

### 8.6 刪除好友

**端點**: `DELETE /friends/:id`
**認證**: 必需

**回應** (200):
```json
{
  "success": true,
  "message": "已刪除好友"
}
```

---

## 9. 通用錯誤處理

所有 API 在遇到錯誤時會返回統一格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求參數驗證失敗",
    "details": [
      {
        "field": "email",
        "message": "Email 格式不正確"
      }
    ]
  }
}
```

常見錯誤場景：

1. **認證失敗** (401):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未提供認證 token 或 token 無效"
  }
}
```

2. **無權限** (403):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "無權限訪問此資源"
  }
}
```

3. **資源不存在** (404):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "找不到指定的資源"
  }
}
```

---

## 10. 速率限制

為防止濫用，API 實施以下速率限制：

- **一般端點**: 100 次/分鐘
- **登入/註冊**: 5 次/分鐘
- **專注紀錄**: 30 次/分鐘

超過限制時返回 429:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "請求過於頻繁，請稍後再試",
    "retry_after": 60
  }
}
```

---

## 11. 版本控制

API 使用 URL 版本控制：
- 當前版本: `/api/v1`
- 未來版本: `/api/v2`

舊版本會保持至少 6 個月的向後兼容。
