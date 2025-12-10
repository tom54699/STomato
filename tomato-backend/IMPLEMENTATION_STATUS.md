# Tomato Backend 實作狀態

## 已完成功能 ✅

### 1. 核心架構
- ✅ Go 專案結構建立
- ✅ 配置管理系統 (環境變數、config.go)
- ✅ PostgreSQL 資料庫連接 (GORM)
- ✅ 自動遷移 (Auto Migration)
- ✅ Docker 和 Docker Compose 配置
- ✅ 錯誤處理和統一回應格式

### 2. 資料模型
- ✅ User (用戶)
- ✅ School (學校)
- ✅ Course (課程)
- ✅ StudyPlan (學習計畫)
- ✅ FocusSession (專注紀錄)
- ✅ Todo (待辦事項) - 模型已建立

### 3. 認證系統
- ✅ 用戶註冊 (POST /api/v1/auth/register)
- ✅ 用戶登入 (POST /api/v1/auth/login)
- ✅ Token 刷新 (POST /api/v1/auth/refresh)
- ✅ 登出 (POST /api/v1/auth/logout)
- ✅ JWT 中間件
- ✅ 密碼加密 (bcrypt)

### 4. 課程管理 API
- ✅ 獲取課程列表 (GET /api/v1/courses)
- ✅ 新增課程 (POST /api/v1/courses)
- ✅ 獲取單個課程 (GET /api/v1/courses/:id)
- ✅ 更新課程 (PUT /api/v1/courses/:id)
- ✅ 刪除課程 (DELETE /api/v1/courses/:id)

### 5. 學習計畫 API
- ✅ 獲取計畫列表 (GET /api/v1/plans)
  - 支援日期篩選 (date, start_date, end_date)
  - 支援完成狀態篩選 (completed)
- ✅ 新增計畫 (POST /api/v1/plans)
- ✅ 獲取單個計畫 (GET /api/v1/plans/:id)
- ✅ 更新計畫 (PUT /api/v1/plans/:id)
- ✅ 刪除計畫 (DELETE /api/v1/plans/:id)
- ✅ 完成/取消完成計畫 (PATCH /api/v1/plans/:id/complete)

### 6. 專注紀錄 API
- ✅ 獲取專注紀錄 (GET /api/v1/sessions)
  - 支援分頁 (limit, offset)
  - 支援日期篩選 (start_date, end_date)
- ✅ 新增專注紀錄 (POST /api/v1/sessions)
  - 自動計算積分
  - 自動更新用戶總積分
  - 自動更新學校總積分
  - 自動更新計畫進度
  - 自動檢查計畫是否完成
- ✅ 獲取統計數據 (GET /api/v1/sessions/stats)
  - 支援多種時間範圍 (week, month, year, lifetime)
  - 每日統計分解
  - 課程分布統計
  - 連續天數計算

### 7. 中間件
- ✅ CORS 中間件
- ✅ JWT 認證中間件
- ✅ 日誌中間件 (Gin 內建)

### 8. 工具函數
- ✅ JWT 生成和驗證
- ✅ 密碼哈希和驗證
- ✅ 統一回應格式
- ✅ 錯誤回應輔助函數

### 9. 文檔
- ✅ README.md (專案總覽)
- ✅ QUICKSTART.md (快速開始指南)
- ✅ docs/database_schema.md (資料庫設計)
- ✅ docs/api_design.md (API 設計)
- ✅ .env.example (環境變數範例)

---

## 待實作功能 ⏳

### 1. 待辦事項 API ✅ (已完成)
- ✅ 獲取待辦列表 (GET /api/v1/todos)
- ✅ 新增待辦 (POST /api/v1/todos)
- ✅ 獲取單個待辦 (GET /api/v1/todos/:id)
- ✅ 更新待辦 (PUT /api/v1/todos/:id)
- ✅ 刪除待辦 (DELETE /api/v1/todos/:id)
- ✅ 完成/取消完成待辦 (PATCH /api/v1/todos/:id/complete)

### 2. 用戶管理 API
- ⏳ 獲取當前用戶資料 (GET /api/v1/users/me)
- ⏳ 更新用戶資料 (PUT /api/v1/users/me)
- ⏳ 獲取用戶統計 (GET /api/v1/users/me/stats)

### 3. 排行榜 API
- ⏳ 學校排行榜 (GET /api/v1/leaderboard/schools)
- ⏳ 學校詳細排名 (GET /api/v1/leaderboard/schools/:id)
- ⏳ 我的排名 (GET /api/v1/leaderboard/me)

### 4. 社交功能 API
- ⏳ 好友列表 (GET /api/v1/friends)
- ⏳ 發送好友請求 (POST /api/v1/friends/request)
- ⏳ 好友請求列表 (GET /api/v1/friends/requests)
- ⏳ 接受好友請求 (POST /api/v1/friends/accept/:id)
- ⏳ 拒絕好友請求 (POST /api/v1/friends/reject/:id)
- ⏳ 刪除好友 (DELETE /api/v1/friends/:id)
- ⏳ Friendship 模型建立

### 5. 測試 ✅ (已完成)
- ✅ 測試框架建立 (testutil package)
- ✅ 測試資料庫配置 (.env.test)
- ✅ Mock 資料生成器 (fixtures.go)
- ✅ HTTP 測試輔助工具 (http.go)
- ✅ 認證 API 單元測試 (auth_test.go)
  - 註冊、登入、Token 刷新、登出
  - 完整認證流程測試
- ✅ 課程 API 單元測試 (course_test.go)
  - 完整 CRUD 操作測試
  - 權限驗證測試
- ✅ 學習計畫 API 測試 (plan_test.go)
  - CRUD 操作、完成狀態切換
  - 篩選功能測試
- ✅ 專注紀錄 API 測試 (session_test.go)
  - 創建紀錄、統計查詢
  - 事務處理測試
  - 自動積分更新測試
  - 計畫自動完成測試
- ✅ 待辦事項 API 測試 (todo_test.go)
  - CRUD 操作、類型驗證
  - 完成狀態切換
  - 篩選功能測試
- ✅ 測試文檔 (docs/testing.md)

### 6. 進階功能
- ⏳ 資料庫觸發器 (積分自動同步)
- ⏳ 密碼重設功能
- ⏳ Email 驗證
- ⏳ 圖片上傳 (頭像、學校 logo)
- ⏳ 速率限制
- ⏳ API 文檔 (Swagger)

### 7. 部署相關
- ⏳ CI/CD 配置
- ⏳ 生產環境部署指南
- ⏳ 資料庫備份策略
- ⏳ 監控和日誌收集

---

## 專案結構

```
tomato-backend/
├── cmd/
│   └── server/
│       └── main.go              ✅ 主程序入口
├── internal/
│   ├── config/
│   │   └── config.go            ✅ 配置管理
│   ├── database/
│   │   └── postgres.go          ✅ 資料庫連接
│   ├── models/
│   │   ├── user.go              ✅ 用戶和學校模型
│   │   ├── course.go            ✅ 課程模型
│   │   ├── study_plan.go        ✅ 學習計畫模型
│   │   ├── focus_session.go     ✅ 專注紀錄模型
│   │   └── todo.go              ✅ 待辦事項模型
│   ├── handlers/
│   │   ├── auth.go              ✅ 認證處理器
│   │   ├── course.go            ✅ 課程處理器
│   │   ├── plan.go              ✅ 計畫處理器
│   │   └── session.go           ✅ 專注紀錄處理器
│   ├── middleware/
│   │   └── auth.go              ✅ JWT 中間件
│   ├── services/                ⏳ 業務邏輯層 (待建立)
│   └── utils/
│       ├── jwt.go               ✅ JWT 工具
│       ├── password.go          ✅ 密碼工具
│       └── response.go          ✅ 回應工具
├── docs/
│   ├── api_design.md            ✅ API 設計文檔
│   └── database_schema.md       ✅ 資料庫設計文檔
├── .env.example                 ✅ 環境變數範例
├── .gitignore                   ✅ Git 忽略檔案
├── docker-compose.yml           ✅ Docker Compose 配置
├── Dockerfile                   ✅ Docker 映像配置
├── go.mod                       ✅ Go 模組定義
├── QUICKSTART.md                ✅ 快速開始指南
└── README.md                    ✅ 專案說明
```

---

## 快速開始

### 使用 Docker Compose（推薦）

```bash
cd tomato-backend
docker-compose up -d
```

### 本地開發

```bash
# 1. 安裝 Go 1.21+
brew install go

# 2. 安裝 PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# 3. 創建資料庫
psql -U postgres -c "CREATE DATABASE tomato_db;"

# 4. 複製並配置環境變數
cp .env.example .env
# 編輯 .env 設置 DB_PASSWORD 和 JWT_SECRET

# 5. 安裝依賴
go mod download

# 6. 運行
go run cmd/server/main.go
```

### 測試 API

```bash
# 健康檢查
curl http://localhost:8080/health

# 註冊用戶
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "測試用戶",
    "school_name": "台灣大學"
  }'

# 登入
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## API 端點總覽

### 認證相關
- ✅ POST `/api/v1/auth/register` - 註冊
- ✅ POST `/api/v1/auth/login` - 登入
- ✅ POST `/api/v1/auth/refresh` - 刷新 token
- ✅ POST `/api/v1/auth/logout` - 登出

### 課程管理
- ✅ GET `/api/v1/courses` - 獲取課程列表
- ✅ POST `/api/v1/courses` - 新增課程
- ✅ GET `/api/v1/courses/:id` - 獲取課程詳情
- ✅ PUT `/api/v1/courses/:id` - 更新課程
- ✅ DELETE `/api/v1/courses/:id` - 刪除課程

### 學習計畫
- ✅ GET `/api/v1/plans` - 獲取計畫列表
- ✅ POST `/api/v1/plans` - 新增計畫
- ✅ GET `/api/v1/plans/:id` - 獲取計畫詳情
- ✅ PUT `/api/v1/plans/:id` - 更新計畫
- ✅ DELETE `/api/v1/plans/:id` - 刪除計畫
- ✅ PATCH `/api/v1/plans/:id/complete` - 完成/取消完成

### 專注紀錄
- ✅ GET `/api/v1/sessions` - 獲取專注紀錄
- ✅ POST `/api/v1/sessions` - 新增專注紀錄
- ✅ GET `/api/v1/sessions/stats` - 獲取統計數據

---

## 技術亮點

1. **事務處理**: 專注紀錄創建使用 GORM 事務，確保積分更新的原子性
2. **關聯預載**: 使用 Preload 優化查詢效能，避免 N+1 問題
3. **軟刪除**: 可選擇性使用 GORM 的軟刪除功能
4. **UUID 主鍵**: 使用 UUID 而非自增 ID，增強安全性
5. **中間件鏈**: 清晰的中間件架構，易於擴展
6. **統一錯誤處理**: 所有錯誤回應格式一致
7. **環境變數管理**: 靈活的配置系統

---

## 下一步計劃

1. **完成待辦事項 API** (1-2 小時)
2. **實作排行榜 API** (2-3 小時)
3. **添加單元測試** (1 天)
4. **連接 React 前端** (2-3 天)
5. **開發 Flutter App** (1 週)
6. **部署到生產環境** (1 天)

---

## 貢獻

歡迎提交 PR！請確保：
- 代碼符合 Go 標準風格 (`go fmt`)
- 添加適當的錯誤處理
- 更新相關文檔

---

## 授權

MIT License

**最後更新**: 2025-12-10
