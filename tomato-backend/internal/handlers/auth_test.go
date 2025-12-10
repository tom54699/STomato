package handlers

import (
	"fmt"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/config"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/testutil"
	"github.com/yourusername/tomato-backend/internal/utils"
)

func setupAuthTests(t *testing.T) (*gin.Engine, func()) {
	// Setup test database
	db := testutil.SetupTestDB(t)
	testutil.MigrateTestDB(t, db)
	database.DB = db

	// Load test config
	if err := config.Load(); err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	// Setup test router
	router := testutil.SetupTestRouter()

	// Cleanup function
	cleanup := func() {
		testutil.CleanupTestDB(t, db)
		testutil.TeardownTestDB(db)
	}

	return router, cleanup
}

func TestRegister(t *testing.T) {
	router, cleanup := setupAuthTests(t)
	defer cleanup()

	router.POST("/auth/register", Register)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "成功註冊",
			requestBody: map[string]interface{}{
				"email":       "test@example.com",
				"password":    "password123",
				"name":        "測試用戶",
				"school_name": "測試大學",
			},
			expectedStatus: 201,
		},
		{
			name: "缺少必填欄位 - email",
			requestBody: map[string]interface{}{
				"password":    "password123",
				"name":        "測試用戶",
				"school_name": "測試大學",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "缺少必填欄位 - password",
			requestBody: map[string]interface{}{
				"email":       "test2@example.com",
				"name":        "測試用戶",
				"school_name": "測試大學",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的 email 格式",
			requestBody: map[string]interface{}{
				"email":       "invalid-email",
				"password":    "password123",
				"name":        "測試用戶",
				"school_name": "測試大學",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "密碼太短",
			requestBody: map[string]interface{}{
				"email":       "test3@example.com",
				"password":    "123",
				"name":        "測試用戶",
				"school_name": "測試大學",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "重複的 email",
			requestBody: map[string]interface{}{
				"email":       "test@example.com", // Same as first test
				"password":    "password123",
				"name":        "測試用戶2",
				"school_name": "測試大學",
			},
			expectedStatus: 409,
			expectedError:  "CONFLICT",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeRequest(t, router, "POST", "/auth/register", tt.requestBody, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				// Verify response contains user and tokens
				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				data, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a map")
				}

				if data["user"] == nil {
					t.Error("Response missing user data")
				}
				if data["access_token"] == nil {
					t.Error("Response missing access_token")
				}
				if data["refresh_token"] == nil {
					t.Error("Response missing refresh_token")
				}
			}
		})
	}
}

func TestLogin(t *testing.T) {
	router, cleanup := setupAuthTests(t)
	defer cleanup()

	router.POST("/auth/login", Login)

	// Create test user
	school := testutil.CreateTestSchool(database.DB, "測試大學")
	testutil.CreateTestUser(database.DB, "test@example.com", "password123", "測試用戶", &school.ID)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "成功登入",
			requestBody: map[string]interface{}{
				"email":    "test@example.com",
				"password": "password123",
			},
			expectedStatus: 200,
		},
		{
			name: "錯誤的密碼",
			requestBody: map[string]interface{}{
				"email":    "test@example.com",
				"password": "wrongpassword",
			},
			expectedStatus: 401,
			expectedError:  "UNAUTHORIZED",
		},
		{
			name: "不存在的用戶",
			requestBody: map[string]interface{}{
				"email":    "nonexistent@example.com",
				"password": "password123",
			},
			expectedStatus: 401,
			expectedError:  "UNAUTHORIZED",
		},
		{
			name: "缺少 email",
			requestBody: map[string]interface{}{
				"password": "password123",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "缺少 password",
			requestBody: map[string]interface{}{
				"email": "test@example.com",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeRequest(t, router, "POST", "/auth/login", tt.requestBody, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				// Verify tokens are returned
				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				data, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a map")
				}

				if data["access_token"] == nil {
					t.Error("Response missing access_token")
				}
				if data["refresh_token"] == nil {
					t.Error("Response missing refresh_token")
				}
			}
		})
	}
}

func TestRefreshToken(t *testing.T) {
	router, cleanup := setupAuthTests(t)
	defer cleanup()

	router.POST("/auth/refresh", RefreshToken)

	// Create test user
	school := testutil.CreateTestSchool(database.DB, "測試大學")
	user := testutil.CreateTestUser(database.DB, "test@example.com", "password123", "測試用戶", &school.ID)

	// Generate valid refresh token
	validRefreshToken, _ := utils.GenerateRefreshToken(user.ID.String(), user.Email)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "成功刷新 token",
			requestBody: map[string]interface{}{
				"refresh_token": validRefreshToken,
			},
			expectedStatus: 200,
		},
		{
			name: "缺少 refresh_token",
			requestBody: map[string]interface{}{
				"refresh_token": "",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的 refresh_token",
			requestBody: map[string]interface{}{
				"refresh_token": "invalid.token.here",
			},
			expectedStatus: 401,
			expectedError:  "UNAUTHORIZED",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeRequest(t, router, "POST", "/auth/refresh", tt.requestBody, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				// Verify new tokens are returned
				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				data, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a map")
				}

				if data["access_token"] == nil {
					t.Error("Response missing new access_token")
				}
				if data["refresh_token"] == nil {
					t.Error("Response missing new refresh_token")
				}
			}
		})
	}
}

func TestLogout(t *testing.T) {
	router, cleanup := setupAuthTests(t)
	defer cleanup()

	router.POST("/auth/logout", middleware.AuthMiddleware(), Logout)

	// Create test user
	school := testutil.CreateTestSchool(database.DB, "測試大學")
	user := testutil.CreateTestUser(database.DB, "test@example.com", "password123", "測試用戶", &school.ID)

	// Generate valid access token
	validToken, _ := utils.GenerateToken(user.ID.String(), user.Email)

	tests := []struct {
		name           string
		token          string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "成功登出",
			token:          validToken,
			expectedStatus: 200,
		},
		{
			name:           "缺少 token",
			token:          "",
			expectedStatus: 401,
			expectedError:  "UNAUTHORIZED",
		},
		{
			name:           "無效的 token",
			token:          "invalid.token.here",
			expectedStatus: 401,
			expectedError:  "UNAUTHORIZED",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/auth/logout", tt.token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)
			}
		})
	}
}

func TestAuthenticationFlow(t *testing.T) {
	router, cleanup := setupAuthTests(t)
	defer cleanup()

	// Setup routes
	router.POST("/auth/register", Register)
	router.POST("/auth/login", Login)
	router.POST("/auth/refresh", RefreshToken)
	router.POST("/auth/logout", middleware.AuthMiddleware(), Logout)

	// Step 1: Register
	registerBody := map[string]interface{}{
		"email":       "flow@example.com",
		"password":    "password123",
		"name":        "流程測試",
		"school_name": "測試大學",
	}
	w := testutil.MakeRequest(t, router, "POST", "/auth/register", registerBody, nil)
	testutil.AssertStatusCode(t, w, 201)

	var registerResponse utils.Response
	testutil.ParseResponse(t, w, &registerResponse)
	registerData := registerResponse.Data.(map[string]interface{})

	accessToken := registerData["access_token"].(string)
	refreshToken := registerData["refresh_token"].(string)

	if accessToken == "" || refreshToken == "" {
		t.Fatal("Failed to get tokens from registration")
	}

	// Step 2: Use access token to logout
	w = testutil.MakeAuthenticatedRequest(t, router, "POST", "/auth/logout", accessToken, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 3: Login again
	loginBody := map[string]interface{}{
		"email":    "flow@example.com",
		"password": "password123",
	}
	w = testutil.MakeRequest(t, router, "POST", "/auth/login", loginBody, nil)
	testutil.AssertStatusCode(t, w, 200)

	var loginResponse utils.Response
	testutil.ParseResponse(t, w, &loginResponse)
	loginData := loginResponse.Data.(map[string]interface{})

	newAccessToken := loginData["access_token"].(string)
	newRefreshToken := loginData["refresh_token"].(string)

	// Step 4: Refresh token
	refreshBody := map[string]interface{}{
		"refresh_token": newRefreshToken,
	}
	w = testutil.MakeRequest(t, router, "POST", "/auth/refresh", refreshBody, nil)
	testutil.AssertStatusCode(t, w, 200)

	var refreshResponse utils.Response
	testutil.ParseResponse(t, w, &refreshResponse)
	refreshData := refreshResponse.Data.(map[string]interface{})

	if refreshData["access_token"] == nil || refreshData["refresh_token"] == nil {
		t.Error("Failed to get new tokens from refresh")
	}

	// Step 5: Use original access token (should still work)
	w = testutil.MakeAuthenticatedRequest(t, router, "POST", "/auth/logout", newAccessToken, nil)
	testutil.AssertStatusCode(t, w, 200)

	fmt.Println("✓ Complete authentication flow test passed")
}
