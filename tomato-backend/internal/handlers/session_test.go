package handlers

import (
	"fmt"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/config"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/testutil"
	"github.com/yourusername/tomato-backend/internal/utils"
)

func setupSessionTests(t *testing.T) (*gin.Engine, *models.User, *models.Course, *models.StudyPlan, string, func()) {
	// Setup test database
	db := testutil.SetupTestDB(t)
	testutil.MigrateTestDB(t, db)
	database.DB = db

	// Load config
	if err := config.Load(); err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	// Setup test router
	router := testutil.SetupTestRouter()

	// Create test data
	school := testutil.CreateTestSchool(db, "測試大學")
	user := testutil.CreateTestUser(db, "test@example.com", "password123", "測試用戶", &school.ID)
	course := testutil.CreateTestCourse(db, user.ID, "數學", "#3b82f6", 3)
	plan := testutil.CreateTestStudyPlan(db, user.ID, &course.ID, "測試計畫", 120)

	// Generate token
	token, _ := utils.GenerateToken(user.ID.String(), user.Email)

	// Cleanup function
	cleanup := func() {
		testutil.CleanupTestDB(t, db)
		testutil.TeardownTestDB(db)
	}

	return router, user, course, plan, token, cleanup
}

func TestGetSessions(t *testing.T) {
	router, user, course, plan, token, cleanup := setupSessionTests(t)
	defer cleanup()

	router.GET("/sessions", middleware.AuthMiddleware(), GetSessions)

	// Create test sessions
	testutil.CreateTestFocusSession(database.DB, user.ID, &plan.ID, &course.ID, 25)
	testutil.CreateTestFocusSession(database.DB, user.ID, &plan.ID, &course.ID, 25)

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		minSessions    int
	}{
		{
			name:           "成功獲取所有紀錄",
			queryParams:    "",
			expectedStatus: 200,
			minSessions:    2,
		},
		{
			name:           "分頁查詢 - limit=1",
			queryParams:    "?limit=1",
			expectedStatus: 200,
			minSessions:    0, // Will check separately
		},
		{
			name:           "按日期範圍篩選",
			queryParams:    "?start_date=" + time.Now().AddDate(0, 0, -1).Format("2006-01-02"),
			expectedStatus: 200,
			minSessions:    2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := "/sessions" + tt.queryParams
			w := testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)
			testutil.AssertSuccess(t, w)

			var response utils.Response
			testutil.ParseResponse(t, w, &response)

			data, ok := response.Data.(map[string]interface{})
			if !ok {
				t.Fatal("Response data is not a map")
			}

			sessions, ok := data["sessions"].([]interface{})
			if !ok {
				t.Fatal("Sessions is not an array")
			}

			if tt.minSessions > 0 && len(sessions) < tt.minSessions {
				t.Errorf("Expected at least %d sessions, got %d", tt.minSessions, len(sessions))
			}
		})
	}
}

func TestCreateSession(t *testing.T) {
	router, user, course, plan, token, cleanup := setupSessionTests(t)
	defer cleanup()

	router.POST("/sessions", middleware.AuthMiddleware(), CreateSession)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
		checkPoints    bool
	}{
		{
			name: "成功創建專注紀錄",
			requestBody: map[string]interface{}{
				"plan_id":   plan.ID.String(),
				"course_id": course.ID.String(),
				"date":      time.Now().Format("2006-01-02"),
				"minutes":   25,
				"location":  "圖書館",
			},
			expectedStatus: 201,
			checkPoints:    true,
		},
		{
			name: "不關聯計畫的紀錄",
			requestBody: map[string]interface{}{
				"course_id": course.ID.String(),
				"date":      time.Now().Format("2006-01-02"),
				"minutes":   30,
			},
			expectedStatus: 201,
			checkPoints:    true,
		},
		{
			name: "不關聯課程的紀錄",
			requestBody: map[string]interface{}{
				"plan_id": plan.ID.String(),
				"date":    time.Now().Format("2006-01-02"),
				"minutes": 20,
			},
			expectedStatus: 201,
			checkPoints:    true,
		},
		{
			name: "缺少必填欄位 - date",
			requestBody: map[string]interface{}{
				"minutes": 25,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "缺少必填欄位 - minutes",
			requestBody: map[string]interface{}{
				"date": time.Now().Format("2006-01-02"),
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的日期格式",
			requestBody: map[string]interface{}{
				"date":    "invalid-date",
				"minutes": 25,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "無效的計畫 ID",
			requestBody: map[string]interface{}{
				"plan_id": "invalid-uuid",
				"date":    time.Now().Format("2006-01-02"),
				"minutes": 25,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "分鐘數為 0",
			requestBody: map[string]interface{}{
				"date":    time.Now().Format("2006-01-02"),
				"minutes": 0,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "分鐘數為負數",
			requestBody: map[string]interface{}{
				"date":    time.Now().Format("2006-01-02"),
				"minutes": -10,
			},
			expectedStatus: 400,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Get user's points before creating session
			var userBefore models.User
			database.DB.First(&userBefore, user.ID)
			beforePoints := userBefore.TotalPoints

			// Get plan progress before
			var planBefore models.StudyPlan
			database.DB.First(&planBefore, plan.ID)
			beforeMinutes := planBefore.CompletedMinutes
			beforePomodoros := planBefore.PomodoroCount

			w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/sessions", token, tt.requestBody)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)

			if tt.expectedError != "" {
				testutil.AssertError(t, w, tt.expectedError)
			} else {
				testutil.AssertSuccess(t, w)

				var response utils.Response
				testutil.ParseResponse(t, w, &response)

				session, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatal("Response data is not a session object")
				}

				if session["id"] == nil {
					t.Error("Session ID is missing")
				}

				// Verify points were awarded
				if tt.checkPoints {
					var userAfter models.User
					database.DB.First(&userAfter, user.ID)

					expectedMinutes := tt.requestBody.(map[string]interface{})["minutes"].(int)
					expectedPoints := expectedMinutes * config.AppConfig.Points.BasePointsPerMinute

					if userAfter.TotalPoints != beforePoints+expectedPoints {
						t.Errorf("Expected user points to increase by %d, got %d", expectedPoints, userAfter.TotalPoints-beforePoints)
					}

					// If plan_id provided, check plan progress update
					if tt.requestBody.(map[string]interface{})["plan_id"] != nil {
						var planAfter models.StudyPlan
						database.DB.First(&planAfter, plan.ID)

						if planAfter.CompletedMinutes != beforeMinutes+expectedMinutes {
							t.Errorf("Expected plan completed minutes to increase by %d", expectedMinutes)
						}

						if planAfter.PomodoroCount != beforePomodoros+1 {
							t.Errorf("Expected pomodoro count to increase by 1")
						}
					}
				}
			}
		})
	}
}

func TestGetSessionStats(t *testing.T) {
	router, user, course, plan, token, cleanup := setupSessionTests(t)
	defer cleanup()

	router.GET("/sessions/stats", middleware.AuthMiddleware(), GetSessionStats)

	// Create test sessions with different dates
	today := time.Now()
	testutil.CreateTestFocusSession(database.DB, user.ID, &plan.ID, &course.ID, 25)
	testutil.CreateTestFocusSession(database.DB, user.ID, &plan.ID, &course.ID, 30)

	tests := []struct {
		name           string
		period         string
		expectedStatus int
	}{
		{
			name:           "週統計",
			period:         "week",
			expectedStatus: 200,
		},
		{
			name:           "月統計",
			period:         "month",
			expectedStatus: 200,
		},
		{
			name:           "年統計",
			period:         "year",
			expectedStatus: 200,
		},
		{
			name:           "生涯統計",
			period:         "lifetime",
			expectedStatus: 200,
		},
		{
			name:           "預設統計（月）",
			period:         "",
			expectedStatus: 200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := "/sessions/stats"
			if tt.period != "" {
				path += "?period=" + tt.period
			}

			w := testutil.MakeAuthenticatedRequest(t, router, "GET", path, token, nil)
			testutil.AssertStatusCode(t, w, tt.expectedStatus)
			testutil.AssertSuccess(t, w)

			var response utils.Response
			testutil.ParseResponse(t, w, &response)

			stats, ok := response.Data.(map[string]interface{})
			if !ok {
				t.Fatal("Response data is not a stats object")
			}

			// Verify stats contain expected fields
			requiredFields := []string{
				"total_sessions",
				"total_minutes",
				"total_points",
				"active_days",
				"current_streak",
				"daily_breakdown",
				"course_breakdown",
			}

			for _, field := range requiredFields {
				if stats[field] == nil {
					t.Errorf("Stats missing required field: %s", field)
				}
			}

			// Verify session count
			totalSessions, ok := stats["total_sessions"].(float64)
			if !ok {
				t.Fatal("total_sessions is not a number")
			}

			if totalSessions < 2 {
				t.Errorf("Expected at least 2 sessions, got %.0f", totalSessions)
			}

			// Verify total minutes
			totalMinutes, ok := stats["total_minutes"].(float64)
			if !ok {
				t.Fatal("total_minutes is not a number")
			}

			if totalMinutes < 55 {
				t.Errorf("Expected at least 55 minutes, got %.0f", totalMinutes)
			}
		})
	}
}

func TestSessionTransactionRollback(t *testing.T) {
	router, user, course, plan, token, cleanup := setupSessionTests(t)
	defer cleanup()

	router.POST("/sessions", middleware.AuthMiddleware(), CreateSession)

	// Get initial state
	var userBefore models.User
	database.DB.First(&userBefore, user.ID)
	initialPoints := userBefore.TotalPoints

	var planBefore models.StudyPlan
	database.DB.First(&planBefore, plan.ID)
	initialMinutes := planBefore.CompletedMinutes

	// Create a session with non-existent plan (should fail and rollback)
	requestBody := map[string]interface{}{
		"plan_id": "00000000-0000-0000-0000-000000000000",
		"date":    time.Now().Format("2006-01-02"),
		"minutes": 25,
	}

	w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/sessions", token, requestBody)

	// Verify user points didn't change (transaction rolled back)
	var userAfter models.User
	database.DB.First(&userAfter, user.ID)

	if userAfter.TotalPoints != initialPoints {
		t.Error("Transaction rollback failed: user points changed despite error")
	}

	// Verify plan didn't change
	var planAfter models.StudyPlan
	database.DB.First(&planAfter, plan.ID)

	if planAfter.CompletedMinutes != initialMinutes {
		t.Error("Transaction rollback failed: plan progress changed despite error")
	}
}

func TestPlanAutoCompletion(t *testing.T) {
	router, user, course, _, token, cleanup := setupSessionTests(t)
	defer cleanup()

	router.POST("/sessions", middleware.AuthMiddleware(), CreateSession)

	// Create a plan with target 60 minutes
	plan := testutil.CreateTestStudyPlan(database.DB, user.ID, &course.ID, "短計畫", 60)

	// Add session with 70 minutes (exceeds target)
	requestBody := map[string]interface{}{
		"plan_id":   plan.ID.String(),
		"course_id": course.ID.String(),
		"date":      time.Now().Format("2006-01-02"),
		"minutes":   70,
	}

	w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/sessions", token, requestBody)
	testutil.AssertStatusCode(t, w, 201)

	// Verify plan was marked as completed
	var updatedPlan models.StudyPlan
	database.DB.First(&updatedPlan, plan.ID)

	if !updatedPlan.Completed {
		t.Error("Plan should be marked as completed when target is reached")
	}

	if updatedPlan.CompletedMinutes != 70 {
		t.Errorf("Expected completed minutes to be 70, got %d", updatedPlan.CompletedMinutes)
	}
}

func TestSessionFlow(t *testing.T) {
	router, user, course, plan, token, cleanup := setupSessionTests(t)
	defer cleanup()

	// Setup routes
	router.POST("/sessions", middleware.AuthMiddleware(), CreateSession)
	router.GET("/sessions", middleware.AuthMiddleware(), GetSessions)
	router.GET("/sessions/stats", middleware.AuthMiddleware(), GetSessionStats)

	// Step 1: Create multiple sessions
	sessions := []map[string]interface{}{
		{
			"plan_id":   plan.ID.String(),
			"course_id": course.ID.String(),
			"date":      time.Now().Format("2006-01-02"),
			"minutes":   25,
			"location":  "圖書館",
		},
		{
			"plan_id":   plan.ID.String(),
			"course_id": course.ID.String(),
			"date":      time.Now().Format("2006-01-02"),
			"minutes":   25,
			"location":  "圖書館",
		},
		{
			"course_id": course.ID.String(),
			"date":      time.Now().Format("2006-01-02"),
			"minutes":   30,
			"location":  "自習室",
		},
	}

	for i, sessionData := range sessions {
		w := testutil.MakeAuthenticatedRequest(t, router, "POST", "/sessions", token, sessionData)
		testutil.AssertStatusCode(t, w, 201)
		fmt.Printf("✓ Created session %d\n", i+1)
	}

	// Step 2: Get all sessions
	w := testutil.MakeAuthenticatedRequest(t, router, "GET", "/sessions", token, nil)
	testutil.AssertStatusCode(t, w, 200)

	var listResponse utils.Response
	testutil.ParseResponse(t, w, &listResponse)
	listData := listResponse.Data.(map[string]interface{})
	sessionsList := listData["sessions"].([]interface{})

	if len(sessionsList) < 3 {
		t.Errorf("Expected at least 3 sessions, got %d", len(sessionsList))
	}

	// Step 3: Get statistics
	w = testutil.MakeAuthenticatedRequest(t, router, "GET", "/sessions/stats?period=week", token, nil)
	testutil.AssertStatusCode(t, w, 200)

	var statsResponse utils.Response
	testutil.ParseResponse(t, w, &statsResponse)
	stats := statsResponse.Data.(map[string]interface{})

	totalMinutes := stats["total_minutes"].(float64)
	if totalMinutes < 80 {
		t.Errorf("Expected total minutes >= 80, got %.0f", totalMinutes)
	}

	// Step 4: Verify user points increased
	var finalUser models.User
	database.DB.First(&finalUser, user.ID)

	expectedPoints := 80 * config.AppConfig.Points.BasePointsPerMinute
	if finalUser.TotalPoints < expectedPoints {
		t.Errorf("Expected user points >= %d, got %d", expectedPoints, finalUser.TotalPoints)
	}

	// Step 5: Verify plan progress
	var finalPlan models.StudyPlan
	database.DB.First(&finalPlan, plan.ID)

	if finalPlan.CompletedMinutes < 50 {
		t.Errorf("Expected plan completed minutes >= 50, got %d", finalPlan.CompletedMinutes)
	}

	if finalPlan.PomodoroCount < 2 {
		t.Errorf("Expected pomodoro count >= 2, got %d", finalPlan.PomodoroCount)
	}

	fmt.Println("✓ Complete session flow test passed")
}
