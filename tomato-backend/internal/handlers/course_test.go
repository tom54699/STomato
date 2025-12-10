package handlers

import (
	"fmt"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/testutil"
	"github.com/yourusername/tomato-backend/internal/utils"
)

func setupCourseTests(t *testing.T) (*gin.Engine, *models.User, string, func()) {
	// Setup test database
	db := testutil.SetupTestDB(t)
	testutil.MigrateTestDB(t, db)
	database.DB = db

	// Setup test router
	router := testutil.SetupTestRouter()

	// Create test user
	school := testutil.CreateTestSchool(db, "測試大學")
	user := testutil.CreateTestUser(db, "test@example.com", "password123", "測試用戶", &school.ID)

	// Generate token
	token, _ := utils.GenerateToken(user.ID.String(), user.Email)

	// Cleanup function
	cleanup := func() {
		testutil.CleanupTestDB(t, db)
		testutil.TeardownTestDB(db)
	}

	return router, user, token, cleanup
}

func TestGetCourses(t *testing.T) {
	router, user, token, cleanup := setupCourseTests(t)
	defer cleanup()

	router.GET("/courses", middleware.AuthMiddleware(), GetCourses)

	// Create test courses
	testutil.CreateTestCourse(database.DB, user.ID, "數學", "#3b82f6", 3)
	testutil.CreateTestCourse(database.DB, user.ID, "物理", "#ef4444", 4)

	t.Run("成功獲取課程列表", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(t, router, "GET", "/courses", token, nil)
		testutil.AssertStatusCode(t, w, 200)
		testutil.AssertSuccess(t, w)

		var response utils.Response
		testutil.ParseResponse(t, w, &response)

		courses, ok := response.Data.([]interface{})
		if !ok {
			t.Fatal("Response data is not an array")
		}

		if len(courses) != 2 {
			t.Errorf("Expected 2 courses, got %d", len(courses))
		}
	})

	t.Run("未認證請求", func(t *testing.T) {
		w := testutil.MakeRequest(t, router, "GET", "/courses", nil, nil)
		testutil.AssertStatusCode(t, w, 401)
		testutil.AssertError(t, w, "UNAUTHORIZED")
	})
}

func TestCreateCourse(t *testing.T) {
	router, user, token, cleanup := setupCourseTests(t)
	defer cleanup()

	router.POST("/courses", middleware.AuthMiddleware(), CreateCourse)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "成功創建課程",
			requestBody: map[string]interface{}{
				"name":           "計算機概論",
				"color":          "#3b82f6",
				"credits":        3,
				"start_date":     "2024-09-01",
				"end_date":       "2025-01-15",
				"day_of_week":    1,
				"start_time":     "09:00",
				"end_time":       "11:00",
				"location":       "理學院101",
				"professor_name": "王教授",
			},
			expectedStatus: 201,
		},
		{
			name: "缺少必填欄位 - name",
			requestBody: map[string]interface{}{
				"color":   "#3b82f6",
				"credits": 3,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的日期格式",
			requestBody: map[string]interface{}{
				"name":        "測試課程",
				"color":       "#3b82f6",
				"credits":     3,
				"start_date":  "invalid-date",
				"day_of_week": 1,
				"start_time":  "09:00",
				"end_time":    "11:00",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的 day_of_week (0-6 範圍外)",
			requestBody: map[string]interface{}{
				"name":        "測試課程",
				"color":       "#3b82f6",
				"credits":     3,
				"start_date":  "2024-09-01",
				"day_of_week": 7,
				"start_time":  "09:00",
				"end_time":    "11:00",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/courses", token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				course, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a course object")
				}

				if course["id"] == nil {
					t.Error("Course ID is missing")
				}
				if course["name"] != tt.requestBody.(map[string]interface{})["name"] {
					t.Error("Course name doesn't match")
				}
			}
		})
	}
}

func TestGetCourse(t *testing.T) {
	router, user, token, cleanup := setupCourseTests(t)
	defer cleanup()

	router.GET("/courses/:id", middleware.AuthMiddleware(), GetCourse)

	// Create test course
	course := testutil.CreateTestCourse(database.DB, user.ID, "數學", "#3b82f6", 3)

	// Create another user's course
	otherSchool := testutil.CreateTestSchool(database.DB, "其他大學")
	otherUser := testutil.CreateTestUser(database.DB, "other@example.com", "password123", "其他用戶", &otherSchool.ID)
	otherCourse := testutil.CreateTestCourse(database.DB, otherUser.ID, "其他課程", "#ef4444", 3)

	tests := []struct {
		name           string
		courseID       string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "成功獲取課程",
			courseID:       course.ID.String(),
			expectedStatus: 200,
		},
		{
			name:           "課程不存在",
			courseID:       "00000000-0000-0000-0000-000000000000",
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:           "無效的課程 ID",
			courseID:       "invalid-uuid",
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name:           "嘗試訪問其他用戶的課程",
			courseID:       otherCourse.ID.String(),
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := fmt.Sprintf("/courses/%s", tt.courseID)
			w := testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)
			}
		})
	}
}

func TestUpdateCourse(t *testing.T) {
	router, user, token, cleanup := setupCourseTests(t)
	defer cleanup()

	router.PUT("/courses/:id", middleware.AuthMiddleware(), UpdateCourse)

	// Create test course
	course := testutil.CreateTestCourse(database.DB, user.ID, "數學", "#3b82f6", 3)

	tests := []struct {
		name           string
		courseID       string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name:     "成功更新課程",
			courseID: course.ID.String(),
			requestBody: map[string]interface{}{
				"name":   "進階數學",
				"color":  "#ef4444",
				"credits": 4,
			},
			expectedStatus: 200,
		},
		{
			name:     "部分更新",
			courseID: course.ID.String(),
			requestBody: map[string]interface{}{
				"name": "微積分",
			},
			expectedStatus: 200,
		},
		{
			name:     "課程不存在",
			courseID: "00000000-0000-0000-0000-000000000000",
			requestBody: map[string]interface{}{
				"name": "測試",
			},
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:     "無效的課程 ID",
			courseID: "invalid-uuid",
			requestBody: map[string]interface{}{
				"name": "測試",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := fmt.Sprintf("/courses/%s", tt.courseID)
			w := testutil.MakeAuthenticatedRequest(t, router, "PUT", path, token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				// Verify update
				if tt.name == "成功更新課程" {
					var response utils.Response
					testutil.ParseResponse(t, w, &response)

					updatedCourse, ok := response.Data.(map[string]interface{})
					if !ok {
						t.Fatal("Response data is not a course object")
					}

					if updatedCourse["name"] != "進階數學" {
						t.Error("Course name was not updated")
					}
				}
			}
		})
	}
}

func TestDeleteCourse(t *testing.T) {
	router, user, token, cleanup := setupCourseTests(t)
	defer cleanup()

	router.DELETE("/courses/:id", middleware.AuthMiddleware(), DeleteCourse)

	tests := []struct {
		name           string
		setupCourse    bool
		courseID       string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "成功刪除課程",
			setupCourse:    true,
			expectedStatus: 200,
		},
		{
			name:           "課程不存在",
			setupCourse:    false,
			courseID:       "00000000-0000-0000-0000-000000000000",
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:           "無效的課程 ID",
			setupCourse:    false,
			courseID:       "invalid-uuid",
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var courseID string
			if tt.setupCourse {
				course := testutil.CreateTestCourse(database.DB, user.ID, "待刪除課程", "#3b82f6", 3)
				courseID = course.ID.String()
			} else {
				courseID = tt.courseID
			}

			path := fmt.Sprintf("/courses/%s", courseID)
			w := testutil.MakeAuthenticatedRequest(t, router, "DELETE", path, token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				// Verify deletion
				var deletedCourse models.Course
				err := database.DB.Where("id = ?", courseID).First(&deletedCourse).Error
				if err == nil {
					t.Error("Course was not deleted from database")
				}
			}
		})
	}
}

func TestCourseCRUDFlow(t *testing.T) {
	router, user, token, cleanup := setupCourseTests(t)
	defer cleanup()

	// Setup routes
	router.POST("/courses", middleware.AuthMiddleware(), CreateCourse)
	router.GET("/courses", middleware.AuthMiddleware(), GetCourses)
	router.GET("/courses/:id", middleware.AuthMiddleware(), GetCourse)
	router.PUT("/courses/:id", middleware.AuthMiddleware(), UpdateCourse)
	router.DELETE("/courses/:id", middleware.AuthMiddleware(), DeleteCourse)

	// Step 1: Create course
	createBody := map[string]interface{}{
		"name":        "軟體工程",
		"color":       "#3b82f6",
		"credits":     3,
		"start_date":  "2024-09-01",
		"day_of_week": 1,
		"start_time":  "09:00",
		"end_time":    "11:00",
	}
	w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/courses", token, createBody)
	testutil.AssertStatusCode(t, w, 201)

	var createResponse utils.Response
	testutil.ParseResponse(t, w, &createResponse)
	course := createResponse.Data.(map[string]interface{})
	courseID := course["id"].(string)

	// Step 2: Get course by ID
	path := fmt.Sprintf("/courses/%s", courseID)
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 3: Update course
	updateBody := map[string]interface{}{
		"name":   "進階軟體工程",
		"credits": 4,
	}
	w = testutil.MakeAuthenticatedRequest(t, router, "PUT", path, token, updateBody)
	testutil.AssertStatusCode(t, w, 200)

	// Step 4: Get all courses
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", "/courses", token, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 5: Delete course
	w = testutil.MakeAuthenticatedRequest(t, router, "DELETE", path, token, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 6: Verify deletion
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
	testutil.AssertStatusCode(t, w, 404)

	fmt.Println("✓ Complete course CRUD flow test passed")
}
