package handlers

import (
	"fmt"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/testutil"
	"github.com/yourusername/tomato-backend/internal/utils"
)

func setupTodoTests(t *testing.T) (*gin.Engine, *models.User, *models.Course, string, func()) {
	// Setup test database
	db := testutil.SetupTestDB(t)
	testutil.MigrateTestDB(t, db)
	database.DB = db

	// Setup test router
	router := testutil.SetupTestRouter()

	// Create test user and course
	school := testutil.CreateTestSchool(db, "測試大學")
	user := testutil.CreateTestUser(db, "test@example.com", "password123", "測試用戶", &school.ID)
	course := testutil.CreateTestCourse(db, user.ID, "數學", "#3b82f6", 3)

	// Generate token
	token, _ := utils.GenerateToken(user.ID.String(), user.Email)

	// Cleanup function
	cleanup := func() {
		testutil.CleanupTestDB(t, db)
		testutil.TeardownTestDB(db)
	}

	return router, user, course, token, cleanup
}

func TestGetTodos(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.GET("/todos", middleware.AuthMiddleware(), GetTodos)

	// Create test todos
	testutil.CreateTestTodo(database.DB, user.ID, &course.ID, "完成作業", models.TodoTypeHomework)
	testutil.CreateTestTodo(database.DB, user.ID, &course.ID, "準備考試", models.TodoTypeExam)
	testutil.CreateTestTodo(database.DB, user.ID, nil, "買文具", models.TodoTypeMemo)

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		minTodos       int
	}{
		{
			name:           "成功獲取所有待辦",
			queryParams:    "",
			expectedStatus: 200,
			minTodos:       3,
		},
		{
			name:           "按日期篩選",
			queryParams:    "?date=" + time.Now().AddDate(0, 0, 1).Format("2006-01-02"),
			expectedStatus: 200,
			minTodos:       3,
		},
		{
			name:           "按類型篩選 - homework",
			queryParams:    "?type=homework",
			expectedStatus: 200,
			minTodos:       1,
		},
		{
			name:           "按類型篩選 - exam",
			queryParams:    "?type=exam",
			expectedStatus: 200,
			minTodos:       1,
		},
		{
			name:           "按類型篩選 - memo",
			queryParams:    "?type=memo",
			expectedStatus: 200,
			minTodos:       1,
		},
		{
			name:           "按完成狀態篩選 - 未完成",
			queryParams:    "?completed=false",
			expectedStatus: 200,
			minTodos:       3,
		},
		{
			name:           "按完成狀態篩選 - 已完成",
			queryParams:    "?completed=true",
			expectedStatus: 200,
			minTodos:       0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := "/todos" + tt.queryParams
			w := testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)
			testutil.AssertSuccess(t, w)

			var response utils.Response
			testutil.ParseResponse(t, w, &response)

			todos, ok := response.Data.([]interface{})
			if !ok {
				t.Fatal("Response data is not an array")
			}

			if len(todos) < tt.minTodos {
				t.Errorf("Expected at least %d todos, got %d", tt.minTodos, len(todos))
			}
		})
	}
}

func TestCreateTodo(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.POST("/todos", middleware.AuthMiddleware(), CreateTodo)

	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "成功創建作業待辦",
			requestBody: map[string]interface{}{
				"title":     "數學作業",
				"course_id": course.ID.String(),
				"date":      tomorrow,
				"todo_type": "homework",
			},
			expectedStatus: 201,
		},
		{
			name: "成功創建考試待辦",
			requestBody: map[string]interface{}{
				"title":     "期中考",
				"course_id": course.ID.String(),
				"date":      tomorrow,
				"todo_type": "exam",
			},
			expectedStatus: 201,
		},
		{
			name: "成功創建備忘待辦",
			requestBody: map[string]interface{}{
				"title":     "買筆記本",
				"date":      tomorrow,
				"todo_type": "memo",
			},
			expectedStatus: 201,
		},
		{
			name: "不關聯課程的待辦",
			requestBody: map[string]interface{}{
				"title":     "讀英文",
				"date":      tomorrow,
				"todo_type": "homework",
			},
			expectedStatus: 201,
		},
		{
			name: "缺少必填欄位 - title",
			requestBody: map[string]interface{}{
				"date":      tomorrow,
				"todo_type": "homework",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "缺少必填欄位 - date",
			requestBody: map[string]interface{}{
				"title":     "測試待辦",
				"todo_type": "homework",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "缺少必填欄位 - todo_type",
			requestBody: map[string]interface{}{
				"title": "測試待辦",
				"date":  tomorrow,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的日期格式",
			requestBody: map[string]interface{}{
				"title":     "測試待辦",
				"date":      "invalid-date",
				"todo_type": "homework",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的課程 ID",
			requestBody: map[string]interface{}{
				"title":     "測試待辦",
				"course_id": "invalid-uuid",
				"date":      tomorrow,
				"todo_type": "homework",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的 todo_type",
			requestBody: map[string]interface{}{
				"title":     "測試待辦",
				"date":      tomorrow,
				"todo_type": "invalid_type",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/todos", token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				todo, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a todo object")
				}

				if todo["id"] == nil {
					t.Error("Todo ID is missing")
				}
				if todo["completed"] != false {
					t.Error("New todo should not be completed")
				}
			}
		})
	}
}

func TestGetTodo(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.GET("/todos/:id", middleware.AuthMiddleware(), GetTodo)

	// Create test todo
	todo := testutil.CreateTestTodo(database.DB, user.ID, &course.ID, "測試待辦", models.TodoTypeHomework)

	// Create another user's todo
	otherSchool := testutil.CreateTestSchool(database.DB, "其他大學")
	otherUser := testutil.CreateTestUser(database.DB, "other@example.com", "password123", "其他用戶", &otherSchool.ID)
	otherTodo := testutil.CreateTestTodo(database.DB, otherUser.ID, nil, "其他待辦", models.TodoTypeMemo)

	tests := []struct {
		name           string
		todoID         string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "成功獲取待辦",
			todoID:         todo.ID.String(),
			expectedStatus: 200,
		},
		{
			name:           "待辦不存在",
			todoID:         "00000000-0000-0000-0000-000000000000",
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:           "無效的待辦 ID",
			todoID:         "invalid-uuid",
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name:           "嘗試訪問其他用戶的待辦",
			todoID:         otherTodo.ID.String(),
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := fmt.Sprintf("/todos/%s", tt.todoID)
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

func TestUpdateTodo(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.PUT("/todos/:id", middleware.AuthMiddleware(), UpdateTodo)

	// Create test todo
	todo := testutil.CreateTestTodo(database.DB, user.ID, &course.ID, "原始待辦", models.TodoTypeHomework)

	tests := []struct {
		name           string
		todoID         string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name:   "成功更新待辦",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"title":     "更新後的待辦",
				"todo_type": "exam",
			},
			expectedStatus: 200,
		},
		{
			name:   "部分更新 - 只更新標題",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"title": "新標題",
			},
			expectedStatus: 200,
		},
		{
			name:   "移除課程關聯",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"course_id": "",
			},
			expectedStatus: 200,
		},
		{
			name:   "更新日期",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"date": time.Now().AddDate(0, 0, 7).Format("2006-01-02"),
			},
			expectedStatus: 200,
		},
		{
			name:   "待辦不存在",
			todoID: "00000000-0000-0000-0000-000000000000",
			requestBody: map[string]interface{}{
				"title": "測試",
			},
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:   "無效的待辦 ID",
			todoID: "invalid-uuid",
			requestBody: map[string]interface{}{
				"title": "測試",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name:   "無效的日期格式",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"date": "invalid-date",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := fmt.Sprintf("/todos/%s", tt.todoID)
			w := testutil.MakeAuthenticatedRequest(t, router, "PUT", path, token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)
			}
		})
	}
}

func TestDeleteTodo(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.DELETE("/todos/:id", middleware.AuthMiddleware(), DeleteTodo)

	tests := []struct {
		name           string
		setupTodo      bool
		todoID         string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "成功刪除待辦",
			setupTodo:      true,
			expectedStatus: 200,
		},
		{
			name:           "待辦不存在",
			setupTodo:      false,
			todoID:         "00000000-0000-0000-0000-000000000000",
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:           "無效的待辦 ID",
			setupTodo:      false,
			todoID:         "invalid-uuid",
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var todoID string
			if tt.setupTodo {
				todo := testutil.CreateTestTodo(database.DB, user.ID, &course.ID, "待刪除待辦", models.TodoTypeHomework)
				todoID = todo.ID.String()
			} else {
				todoID = tt.todoID
			}

			path := fmt.Sprintf("/todos/%s", todoID)
			w := testutil.MakeAuthenticatedRequest(t, router, "DELETE", path, token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				// Verify deletion
				var deletedTodo models.Todo
				err := database.DB.Where("id = ?", todoID).First(&deletedTodo).Error
				if err == nil {
					t.Error("Todo was not deleted from database")
				}
			}
		})
	}
}

func TestToggleTodoComplete(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.PATCH("/todos/:id/complete", middleware.AuthMiddleware(), ToggleTodoComplete)

	// Create test todo
	todo := testutil.CreateTestTodo(database.DB, user.ID, &course.ID, "測試待辦", models.TodoTypeHomework)

	tests := []struct {
		name           string
		todoID         string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name:   "標記為完成",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"completed": true,
			},
			expectedStatus: 200,
		},
		{
			name:   "標記為未完成",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"completed": false,
			},
			expectedStatus: 200,
		},
		{
			name:   "缺少 completed 欄位",
			todoID: todo.ID.String(),
			requestBody: map[string]interface{}{
				"other_field": "value",
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name:   "待辦不存在",
			todoID: "00000000-0000-0000-0000-000000000000",
			requestBody: map[string]interface{}{
				"completed": true,
			},
			expectedStatus: 404,
			expectedError:  "NOT_FOUND",
		},
		{
			name:   "無效的待辦 ID",
			todoID: "invalid-uuid",
			requestBody: map[string]interface{}{
				"completed": true,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := fmt.Sprintf("/todos/%s/complete", tt.todoID)
			w := testutil.MakeAuthenticatedRequest(t, router, "PATCH", path, token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				updatedTodo, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a todo object")
				}

				expectedCompleted := tt.requestBody.(map[string]interface{})["completed"].(bool)
				if updatedTodo["completed"] != expectedCompleted {
					t.Errorf("Expected completed=%v, got %v", expectedCompleted, updatedTodo["completed"])
				}
			}
		})
	}
}

func TestTodoCRUDFlow(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	// Setup routes
	router.POST("/todos", middleware.AuthMiddleware(), CreateTodo)
	router.GET("/todos", middleware.AuthMiddleware(), GetTodos)
	router.GET("/todos/:id", middleware.AuthMiddleware(), GetTodo)
	router.PUT("/todos/:id", middleware.AuthMiddleware(), UpdateTodo)
	router.PATCH("/todos/:id/complete", middleware.AuthMiddleware(), ToggleTodoComplete)
	router.DELETE("/todos/:id", middleware.AuthMiddleware(), DeleteTodo)

	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	// Step 1: Create todo
	createBody := map[string]interface{}{
		"title":     "完成期末報告",
		"course_id": course.ID.String(),
		"date":      tomorrow,
		"todo_type": "homework",
	}
	w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/todos", token, createBody)
	testutil.AssertStatusCode(t, w, 201)

	var createResponse utils.Response
	testutil.ParseResponse(t, w, &createResponse)
	todo := createResponse.Data.(map[string]interface{})
	todoID := todo["id"].(string)

	// Step 2: Get todo by ID
	path := fmt.Sprintf("/todos/%s", todoID)
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 3: Update todo
	updateBody := map[string]interface{}{
		"title":     "完成期末專題報告",
		"todo_type": "exam",
	}
	w = testutil.MakeAuthenticatedRequest(t, router, "PUT", path, token, updateBody)
	testutil.AssertStatusCode(t, w, 200)

	// Step 4: Toggle completion
	toggleBody := map[string]interface{}{
		"completed": true,
	}
	completePath := fmt.Sprintf("/todos/%s/complete", todoID)
	w = testutil.MakeAuthenticatedRequest(t, router, "PATCH", completePath, token, toggleBody)
	testutil.AssertStatusCode(t, w, 200)

	// Step 5: Get all todos
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", "/todos", token, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 6: Filter by type
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", "/todos?type=exam", token, nil)
	testutil.AssertStatusCode(t, w, 200)

	var filterResponse utils.Response
	testutil.ParseResponse(t, w, &filterResponse)
	filteredTodos := filterResponse.Data.([]interface{})

	if len(filteredTodos) < 1 {
		t.Error("Expected at least 1 todo with type=exam")
	}

	// Step 7: Delete todo
	w = testutil.MakeAuthenticatedRequest(t, router, "DELETE", path, token, nil)
	testutil.AssertStatusCode(t, w, 200)

	// Step 8: Verify deletion
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
	testutil.AssertStatusCode(t, w, 404)

	fmt.Println("✓ Complete todo CRUD flow test passed")
}

func TestTodoTypeValidation(t *testing.T) {
	router, user, course, token, cleanup := setupTodoTests(t)
	defer cleanup()

	router.POST("/todos", middleware.AuthMiddleware(), CreateTodo)

	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	validTypes := []string{"homework", "exam", "memo"}

	for _, todoType := range validTypes {
		t.Run(fmt.Sprintf("Valid type: %s", todoType), func(t *testing.T) {
			requestBody := map[string]interface{}{
				"title":     fmt.Sprintf("測試 %s", todoType),
				"course_id": course.ID.String(),
				"date":      tomorrow,
				"todo_type": todoType,
			}

			w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/todos", token, requestBody)
			testutil.AssertStatusCode(t, w, 201)
			testutil.AssertSuccess(t, w)
		})
	}
}
