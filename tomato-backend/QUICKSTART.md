# 快速開始指南

## 前置需求

在開始之前，請確保你的系統已安裝：

1. **Go 1.21+**
   ```bash
   # macOS
   brew install go

   # 或下載: https://go.dev/dl/
   ```

2. **PostgreSQL 15+**
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15
   ```

3. **Docker & Docker Compose** (可選，用於容器化部署)
   ```bash
   # macOS
   brew install docker docker-compose
   ```

## 安裝步驟

### 方法 1: 本地開發（推薦）

1. **複製環境變數**
   ```bash
   cd tomato-backend
   cp .env.example .env
   ```

2. **編輯 `.env` 檔案，設置你的配置**
   ```bash
   # 特別注意修改以下內容：
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
   ```

3. **創建資料庫**
   ```bash
   psql -U postgres -c "CREATE DATABASE tomato_db;"
   ```

4. **安裝 Go 依賴**
   ```bash
   go mod download
   ```

5. **運行應用程式**
   ```bash
   go run cmd/server/main.go
   ```

   成功啟動後，你會看到：
   ```
   Database connection established successfully
   Running auto migration...
   Auto migration completed successfully
   Server starting on port 8080
   ```

6. **測試 API**
   ```bash
   curl http://localhost:8080/health
   ```

   應該返回：
   ```json
   {
     "status": "ok",
     "message": "Tomato Backend API is running"
   }
   ```

### 方法 2: 使用 Docker Compose

1. **啟動所有服務**
   ```bash
   docker-compose up -d
   ```

   這會自動啟動：
   - PostgreSQL 資料庫 (port 5432)
   - Go API 服務 (port 8080)

2. **查看日誌**
   ```bash
   docker-compose logs -f api
   ```

3. **停止服務**
   ```bash
   docker-compose down
   ```

4. **完全清除（包含資料庫資料）**
   ```bash
   docker-compose down -v
   ```

## 測試 API

### 1. 註冊用戶

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "測試用戶",
    "school_name": "台灣大學"
  }'
```

成功回應：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "name": "測試用戶",
      "school": {
        "id": "uuid",
        "name": "台灣大學"
      },
      "total_points": 0
    },
    "token": "jwt_token_here",
    "refresh_token": "refresh_token_here"
  },
  "message": "註冊成功"
}
```

### 2. 登入

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. 使用 Token 訪問受保護的端點

```bash
# 將 TOKEN 替換為登入後獲得的 token
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## 開發工作流

### 運行開發伺服器

```bash
# 使用 air 實現熱重載（推薦）
go install github.com/cosmtrek/air@latest
air

# 或直接運行
go run cmd/server/main.go
```

### 代碼格式化

```bash
go fmt ./...
```

### 運行測試

```bash
go test ./...
```

### 檢查代碼

```bash
go vet ./...
```

## 資料庫管理

### 重置資料庫

```bash
# 刪除並重建資料庫
psql -U postgres -c "DROP DATABASE tomato_db;"
psql -U postgres -c "CREATE DATABASE tomato_db;"

# 重新運行應用程式，auto migrate 會自動創建表
go run cmd/server/main.go
```

### 查看資料庫內容

```bash
# 連接到資料庫
psql -U postgres -d tomato_db

# 查看所有表
\dt

# 查看用戶
SELECT * FROM users;

# 查看學校
SELECT * FROM schools;

# 退出
\q
```

## 常見問題

### 1. 端口被占用

如果 8080 端口被占用，修改 `.env` 中的 `PORT`:
```
PORT=8081
```

### 2. 資料庫連接失敗

檢查：
- PostgreSQL 是否運行: `brew services list`
- 用戶名和密碼是否正確
- 資料庫是否存在: `psql -U postgres -l`

### 3. Go 模組下載失敗

設置 Go 代理：
```bash
export GOPROXY=https://goproxy.io,direct
go mod download
```

### 4. JWT_SECRET 未設置

錯誤訊息：`JWT_SECRET is required`

解決：在 `.env` 中設置一個強密碼：
```
JWT_SECRET=this_is_a_very_long_and_secure_secret_key_please_change_it
```

## 下一步

現在後端基礎架構已經完成，接下來可以：

1. **實作剩餘的 API 端點**
   - 課程管理 (CRUD)
   - 學習計畫 (CRUD)
   - 專注紀錄和統計
   - 排行榜
   - 社交功能

2. **連接前端**
   - React Web App
   - Flutter Mobile App

3. **部署到生產環境**
   - Railway
   - Render
   - AWS/GCP

## 獲取幫助

遇到問題？

1. 查看日誌輸出
2. 檢查 `.env` 配置
3. 確認 Go 和 PostgreSQL 版本
4. 查看 GitHub Issues

Happy Coding! 🍅
