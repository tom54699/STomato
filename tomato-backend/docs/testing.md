# 測試文檔

本文檔說明如何運行和編寫 Tomato Backend 的測試。

## 目錄

- [測試架構](#測試架構)
- [設置測試環境](#設置測試環境)
- [運行測試](#運行測試)
- [編寫測試](#編寫測試)
- [測試覆蓋率](#測試覆蓋率)
- [最佳實踐](#最佳實踐)

## 測試架構

我們的測試架構包含以下組件：

### 測試工具包 (testutil)

位於 `internal/testutil/`，提供測試輔助函數：

- **database.go** - 測試資料庫設置和清理
- **fixtures.go** - Mock 資料生成器
- **http.go** - HTTP 測試輔助工具

### 測試類型

1. **單元測試** - 測試單個處理器函數
2. **集成測試** - 測試完整的 API 流程
3. **端對端測試** - 測試跨模組交互

## 設置測試環境

### 1. 安裝 PostgreSQL

測試需要一個獨立的 PostgreSQL 測試資料庫。

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### 2. 創建測試資料庫

```bash
psql -U postgres -c "CREATE DATABASE tomato_test;"
```

### 3. 配置測試環境變數

複製 `.env.test` 並根據需要修改：

```bash
# 測試資料庫配置
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres
TEST_DB_NAME=tomato_test

# JWT 測試金鑰
JWT_SECRET=test_secret_key_for_testing_only
```

## 運行測試

### 運行所有測試

```bash
cd tomato-backend
go test ./... -v
```

### 運行特定包的測試

```bash
# 測試認證 API
go test ./internal/handlers -run TestRegister -v

# 測試課程 API
go test ./internal/handlers -run TestCourse -v
```

### 運行單個測試函數

```bash
go test ./internal/handlers -run TestRegister/成功註冊 -v
```

### 並行運行測試

```bash
go test ./... -v -parallel 4
```

### 顯示測試覆蓋率

```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## 編寫測試

### 基本測試結構

```go
package handlers

import (
	"testing"
	"github.com/yourusername/tomato-backend/internal/testutil"
)

func TestYourHandler(t *testing.T) {
	// 1. 設置測試環境
	router, user, token, cleanup := setupTests(t)
	defer cleanup()

	// 2. 設置路由
	router.POST("/your-endpoint", YourHandler)

	// 3. 定義測試用例
	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "成功案例",
			requestBody: map[string]interface{}{
				"field": "value",
			},
			expectedStatus: 200,
		},
		// 更多測試用例...
	}

	// 4. 運行測試
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/your-endpoint", token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)
			}
		})
	}
}
```

### 使用測試輔助函數

#### 創建測試資料

```go
// 創建學校
school := testutil.CreateTestSchool(db, "測試大學")

// 創建用戶
user := testutil.CreateTestUser(db, "test@example.com", "password123", "測試用戶", &school.ID)

// 創建課程
course := testutil.CreateTestCourse(db, user.ID, "數學", "#3b82f6", 3)

// 創建學習計畫
plan := testutil.CreateTestStudyPlan(db, user.ID, &course.ID, "測試計畫", 120)
```

#### HTTP 請求測試

```go
// 未認證請求
w := testutil.MakeRequest(t, router, "GET", "/endpoint", requestBody, nil)

// 認證請求
w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/endpoint", token, requestBody)

// 自定義 Headers
headers := map[string]string{
	"X-Custom-Header": "value",
}
w := testutil.MakeRequest(t, router, "GET", "/endpoint", nil, headers)
```

#### 斷言

```go
// 檢查狀態碼
testutil.AssertStatusCode(t, w, 200)

// 檢查成功回應
testutil.AssertSuccess(t, w)

// 檢查錯誤回應
testutil.AssertError(t, w, "VALIDATION_ERROR")

// 解析回應
var response utils.Response
testutil.ParseResponse(t, w, &response)
```

### 測試資料庫操作

```go
func TestDatabaseOperation(t *testing.T) {
	db := testutil.SetupTestDB(t)
	testutil.MigrateTestDB(t, db)
	defer func() {
		testutil.CleanupTestDB(t, db)
		testutil.TeardownTestDB(db)
	}()

	// 你的測試邏輯...
}
```

### 測試完整流程

```go
func TestCompleteFlow(t *testing.T) {
	router, cleanup := setupTests(t)
	defer cleanup()

	// 設置所有路由
	router.POST("/auth/register", Register)
	router.POST("/auth/login", Login)
	router.GET("/courses", middleware.AuthMiddleware(), GetCourses)

	// Step 1: 註冊
	registerBody := map[string]interface{}{
		"email": "test@example.com",
		"password": "password123",
		"name": "測試用戶",
		"school_name": "測試大學",
	}
	w := testutil.MakeRequest(t, router, "POST", "/auth/register", registerBody, nil)
	testutil.AssertStatusCode(t, w, 201)

	// Step 2: 登入
	loginBody := map[string]interface{}{
		"email": "test@example.com",
		"password": "password123",
	}
	w = testutil.MakeRequest(t, router, "POST", "/auth/login", loginBody, nil)

	var loginResponse utils.Response
	testutil.ParseResponse(t, w, &loginResponse)
	data := loginResponse.Data.(map[string]interface{})
	token := data["access_token"].(string)

	// Step 3: 使用 token 訪問受保護的端點
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", "/courses", token, nil)
	testutil.AssertStatusCode(t, w, 200)
}
```

## 測試覆蓋率

### 生成覆蓋率報告

```bash
# 生成覆蓋率數據
go test ./... -coverprofile=coverage.out -covermode=atomic

# 查看覆蓋率摘要
go tool cover -func=coverage.out

# 生成 HTML 報告
go tool cover -html=coverage.out -o coverage.html

# 在瀏覽器中打開
open coverage.html  # macOS
xdg-open coverage.html  # Linux
```

### 覆蓋率目標

- **總體覆蓋率**: > 80%
- **關鍵處理器**: > 90%
- **工具函數**: > 95%

## 最佳實踐

### 1. 測試命名

使用描述性的測試名稱：

```go
✅ Good:
t.Run("成功創建課程", func(t *testing.T) { ... })
t.Run("缺少必填欄位時返回錯誤", func(t *testing.T) { ... })

❌ Bad:
t.Run("test1", func(t *testing.T) { ... })
t.Run("test_create", func(t *testing.T) { ... })
```

### 2. 資料隔離

每個測試應該獨立運行，不依賴其他測試：

```go
func TestSomething(t *testing.T) {
	// 每個測試都設置自己的資料
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	// 測試邏輯...
}
```

### 3. 測試邊界條件

不僅測試正常情況，還要測試：

- 空輸入
- 無效輸入
- 邊界值
- 錯誤處理

```go
tests := []struct {
	name string
	// ...
}{
	{"正常案例", ...},
	{"空字串", ...},
	{"超長字串", ...},
	{"無效格式", ...},
	{"SQL 注入嘗試", ...},
}
```

### 4. 使用表驅動測試

```go
tests := []struct {
	name           string
	input          interface{}
	expectedStatus int
	expectedError  string
}{
	// 測試案例...
}

for _, tt := range tests {
	t.Run(tt.name, func(t *testing.T) {
		// 測試邏輯...
	})
}
```

### 5. 清理資源

總是使用 `defer` 清理測試資源：

```go
func TestSomething(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer func() {
		testutil.CleanupTestDB(t, db)
		testutil.TeardownTestDB(db)
	}()

	// 測試邏輯...
}
```

### 6. Mock 外部依賴

不要在測試中調用真實的外部 API：

```go
// 使用 mock 或 stub
type MockEmailService struct{}

func (m *MockEmailService) Send(to, subject, body string) error {
	// 不真正發送郵件
	return nil
}
```

## 持續集成 (CI)

### GitHub Actions 範例

創建 `.github/workflows/test.yml`：

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tomato_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Install dependencies
        run: go mod download

      - name: Run tests
        env:
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5432
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres
          TEST_DB_NAME: tomato_test
        run: go test ./... -v -coverprofile=coverage.out

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.out
```

## 故障排除

### 測試資料庫連接失敗

```
Error: Failed to connect to test database
```

**解決方法:**
1. 確認 PostgreSQL 正在運行
2. 檢查 `.env.test` 配置
3. 確認測試資料庫已創建

### 測試超時

```
Error: test timed out after 10m0s
```

**解決方法:**
1. 增加測試超時時間: `go test -timeout 30m`
2. 檢查是否有死鎖或無限循環

### 並行測試失敗

```
Error: database is locked
```

**解決方法:**
1. 確保每個測試使用獨立的資料
2. 或減少並行度: `go test -parallel 1`

## 參考資源

- [Go Testing 官方文檔](https://golang.org/pkg/testing/)
- [Gin Testing](https://github.com/gin-gonic/gin#testing)
- [GORM Testing](https://gorm.io/docs/testing.html)
- [Table Driven Tests in Go](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests)

---

**最後更新**: 2025-12-10
