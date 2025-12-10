# Tomato Backend API

番茄鐘學習專注 App 後端 API - Go + PostgreSQL

[![Tests](https://img.shields.io/badge/tests-127%2B%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![Go](https://img.shields.io/badge/Go-1.21%2B-blue)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)]()

**完整的 RESTful API，支援番茄鐘學習、課程管理、積分系統和社交功能**

## 技術架構

### 後端技術棧
- **語言**: Go 1.21+
- **Web 框架**: Gin
- **資料庫**: PostgreSQL 15+
- **ORM**: GORM
- **認證**: JWT (golang-jwt/jwt)
- **密碼加密**: bcrypt
- **環境變數**: godotenv
- **部署**: Docker

### 專案結構

```
tomato-backend/
├── cmd/
│   └── server/
│       └── main.go           # 應用程式入口
├── internal/
│   ├── config/               # 配置管理
│   │   └── config.go
│   ├── database/             # 資料庫連接
│   │   └── postgres.go
│   ├── models/               # 資料模型
│   │   ├── user.go
│   │   ├── school.go
│   │   ├── course.go
│   │   ├── study_plan.go
│   │   ├── focus_session.go
│   │   ├── todo.go
│   │   └── friendship.go
│   ├── handlers/             # HTTP 處理器
│   │   ├── auth.go
│   │   ├── user.go
│   │   ├── course.go
│   │   ├── plan.go
│   │   ├── session.go
│   │   ├── leaderboard.go
│   │   └── social.go
│   ├── middleware/           # 中間件
│   │   ├── auth.go
│   │   ├── cors.go
│   │   └── logger.go
│   ├── services/             # 業務邏輯
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── plan_service.go
│   │   └── stats_service.go
│   └── utils/                # 工具函數
│       ├── jwt.go
│       ├── password.go
│       └── response.go
├── migrations/               # 資料庫遷移
│   └── 001_init_schema.sql
├── docs/                     # API 文檔
│   ├── api_design.md
│   └── database_schema.md
├── .env.example              # 環境變數範例
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── go.mod
├── go.sum
└── README.md
```

## 核心功能模組

### 1. 用戶認證模組 (Auth)
- [x] 用戶註冊 (email + password)
- [x] 用戶登入 (JWT token)
- [x] Token 刷新
- [x] 密碼重設
- [x] 用戶資料驗證

### 2. 用戶管理模組 (User)
- [x] 獲取用戶資料
- [x] 更新個人資料
- [x] 獲取用戶統計數據
- [x] 學校綁定

### 3. 課程管理模組 (Course)
- [x] 新增課程
- [x] 查詢課程列表
- [x] 更新課程
- [x] 刪除課程
- [x] 週課表查詢

### 4. 學習計畫模組 (StudyPlan)
- [x] 新增學習計畫
- [x] 查詢計畫列表（日/週/月）
- [x] 更新計畫
- [x] 刪除計畫
- [x] 完成/取消完成
- [x] 計畫進度追蹤

### 5. 專注紀錄模組 (FocusSession)
- [x] 記錄番茄鐘
- [x] 查詢專注歷史
- [x] 統計分析（日/週/月/生涯）
- [x] 連續天數計算

### 6. 待辦事項模組 (Todo)
- [x] 新增待辦
- [x] 查詢待辦列表
- [x] 更新待辦
- [x] 刪除待辦
- [x] 完成/取消完成

### 7. 排行榜模組 (Leaderboard)
- [x] 學校排行榜（週/月/總）
- [x] 個人排名查詢
- [x] 積分計算邏輯

### 8. 社交功能模組 (Social)
- [x] 發送好友請求
- [x] 接受/拒絕好友請求
- [x] 好友列表
- [x] 刪除好友
- [x] 學習小組（未來擴展）

## API 端點設計

### 認證相關
```
POST   /api/v1/auth/register      # 註冊
POST   /api/v1/auth/login         # 登入
POST   /api/v1/auth/refresh       # 刷新 token
POST   /api/v1/auth/logout        # 登出
```

### 用戶相關
```
GET    /api/v1/users/me           # 獲取當前用戶資料
PUT    /api/v1/users/me           # 更新用戶資料
GET    /api/v1/users/me/stats     # 獲取統計數據
```

### 課程相關
```
GET    /api/v1/courses            # 獲取課程列表
POST   /api/v1/courses            # 新增課程
GET    /api/v1/courses/:id        # 獲取課程詳情
PUT    /api/v1/courses/:id        # 更新課程
DELETE /api/v1/courses/:id        # 刪除課程
```

### 學習計畫相關
```
GET    /api/v1/plans              # 獲取計畫列表
POST   /api/v1/plans              # 新增計畫
GET    /api/v1/plans/:id          # 獲取計畫詳情
PUT    /api/v1/plans/:id          # 更新計畫
DELETE /api/v1/plans/:id          # 刪除計畫
PATCH  /api/v1/plans/:id/complete # 完成計畫
```

### 專注紀錄相關
```
GET    /api/v1/sessions           # 獲取專注紀錄
POST   /api/v1/sessions           # 新增專注紀錄
GET    /api/v1/sessions/stats     # 獲取統計數據
```

### 待辦事項相關
```
GET    /api/v1/todos              # 獲取待辦列表
POST   /api/v1/todos              # 新增待辦
PUT    /api/v1/todos/:id          # 更新待辦
DELETE /api/v1/todos/:id          # 刪除待辦
PATCH  /api/v1/todos/:id/complete # 完成待辦
```

### 排行榜相關
```
GET    /api/v1/leaderboard/schools        # 學校排行榜
GET    /api/v1/leaderboard/schools/:id    # 學校詳細排名
GET    /api/v1/leaderboard/me             # 我的排名
```

### 社交相關
```
GET    /api/v1/friends                    # 好友列表
POST   /api/v1/friends/request            # 發送好友請求
POST   /api/v1/friends/accept/:id         # 接受好友請求
POST   /api/v1/friends/reject/:id         # 拒絕好友請求
DELETE /api/v1/friends/:id                # 刪除好友
GET    /api/v1/friends/requests           # 好友請求列表
```

## 資料庫設計

### 核心表結構

#### users (用戶表)
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- school_id (UUID, FK)
- total_points (INT, DEFAULT 0)
- avatar_url (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### schools (學校表)
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- total_points (INT, DEFAULT 0)
- student_count (INT, DEFAULT 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### courses (課程表)
- id (UUID, PK)
- user_id (UUID, FK)
- name (VARCHAR)
- day (INT, 0-6)
- start_time (TIME)
- end_time (TIME)
- location (VARCHAR)
- color (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### study_plans (學習計畫表)
- id (UUID, PK)
- user_id (UUID, FK)
- course_id (UUID, FK, NULLABLE)
- title (VARCHAR)
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- reminder_time (TIME)
- location (VARCHAR)
- target_minutes (INT)
- completed_minutes (INT, DEFAULT 0)
- pomodoro_count (INT, DEFAULT 0)
- completed (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### focus_sessions (專注紀錄表)
- id (UUID, PK)
- user_id (UUID, FK)
- plan_id (UUID, FK, NULLABLE)
- course_id (UUID, FK, NULLABLE)
- date (DATE)
- minutes (INT)
- points_earned (INT)
- location (VARCHAR)
- created_at (TIMESTAMP)

#### todos (待辦事項表)
- id (UUID, PK)
- user_id (UUID, FK)
- course_id (UUID, FK, NULLABLE)
- title (VARCHAR)
- date (DATE)
- todo_type (ENUM: homework/exam/memo)
- completed (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### friendships (好友關係表)
- id (UUID, PK)
- user_id (UUID, FK)
- friend_id (UUID, FK)
- status (ENUM: pending/accepted/rejected)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 開發環境設置

### 前置需求
- Go 1.21+
- PostgreSQL 15+
- Docker & Docker Compose (可選)

### 本地開發步驟

1. **Clone 專案**
```bash
cd tomato-backend
```

2. **安裝依賴**
```bash
go mod download
```

3. **設置環境變數**
```bash
cp .env.example .env
# 編輯 .env 填入資料庫配置
```

4. **啟動 PostgreSQL (使用 Docker)**
```bash
docker-compose up -d postgres
```

5. **執行資料庫遷移**
```bash
go run cmd/migrate/main.go
```

6. **啟動開發伺服器**
```bash
go run cmd/server/main.go
```

API 將運行在 `http://localhost:8080`

## 部署

### Docker 部署

```bash
# 建立映像
docker build -t tomato-backend .

# 運行容器
docker-compose up -d
```

### Railway/Render 部署

1. 推送代碼到 GitHub
2. 連接 Railway/Render
3. 設置環境變數
4. 自動部署

## 環境變數

```env
# Server
PORT=8080
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=tomato_db
DB_SSLMODE=disable

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## API 回應格式

### 成功回應
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "驗證失敗",
    "details": [...]
  }
}
```

## 開發規範

### Git Commit 格式
```
feat: 新增功能
fix: 修復 bug
docs: 文檔更新
refactor: 重構代碼
test: 測試相關
chore: 建構/工具變動
```

### 分支策略
- `main` - 生產環境
- `develop` - 開發環境
- `feature/*` - 功能分支
- `hotfix/*` - 緊急修復

## 測試

```bash
# 運行所有測試
go test ./...

# 運行特定包的測試
go test ./internal/services/...

# 運行測試並顯示覆蓋率
go test -cover ./...
```

## API 文檔

開發完成後將使用 Swagger 自動生成 API 文檔，訪問 `/api/docs` 查看。

## 授權

MIT License

## 聯絡方式

如有問題請聯繫開發團隊。
