package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/tomato-backend/internal/config"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/utils"
	"gorm.io/gorm"
)

type CreateSessionRequest struct {
	PlanID   *string `json:"plan_id"`
	CourseID *string `json:"course_id"`
	Date     string  `json:"date" binding:"required"` // YYYY-MM-DD
	Minutes  int     `json:"minutes" binding:"required,min=1"`
	Location string  `json:"location"`
}

// GetSessions retrieves focus sessions with pagination
func GetSessions(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	// Pagination
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if val, err := utils.ParseInt(l); err == nil && val > 0 {
			limit = val
		}
	}
	if o := c.Query("offset"); o != "" {
		if val, err := utils.ParseInt(o); err == nil && val >= 0 {
			offset = val
		}
	}

	query := database.DB.Where("user_id = ?", userID)

	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	// Get total count
	var total int64
	query.Model(&models.FocusSession{}).Count(&total)

	// Get sessions
	var sessions []models.FocusSession
	if err := query.Preload("Plan").Preload("Course").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&sessions).Error; err != nil {
		utils.InternalErrorResponse(c, "查詢專注紀錄失敗")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{
		"sessions": sessions,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	}, "")
}

// CreateSession creates a new focus session and updates related data
func CreateSession(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Parse date
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		utils.ValidationErrorResponse(c, "日期格式錯誤，應為 YYYY-MM-DD")
		return
	}

	// Calculate points
	basePoints := req.Minutes * config.AppConfig.Points.BasePointsPerMinute
	// TODO: Add streak bonus calculation if needed
	pointsEarned := basePoints

	session := models.FocusSession{
		UserID:       userID,
		Date:         date,
		Minutes:      req.Minutes,
		PointsEarned: pointsEarned,
		Location:     req.Location,
	}

	// Set plan ID if provided
	if req.PlanID != nil && *req.PlanID != "" {
		planID, err := uuid.Parse(*req.PlanID)
		if err != nil {
			utils.ValidationErrorResponse(c, "無效的計畫 ID")
			return
		}
		session.PlanID = &planID
	}

	// Set course ID if provided
	if req.CourseID != nil && *req.CourseID != "" {
		courseID, err := uuid.Parse(*req.CourseID)
		if err != nil {
			utils.ValidationErrorResponse(c, "無效的課程 ID")
			return
		}
		session.CourseID = &courseID
	}

	// Start transaction
	tx := database.DB.Begin()

	// Create session
	if err := tx.Create(&session).Error; err != nil {
		tx.Rollback()
		utils.InternalErrorResponse(c, "專注紀錄創建失敗")
		return
	}

	// Update user total points
	if err := tx.Model(&models.User{}).
		Where("id = ?", userID).
		UpdateColumn("total_points", gorm.Expr("total_points + ?", pointsEarned)).
		Error; err != nil {
		tx.Rollback()
		utils.InternalErrorResponse(c, "更新用戶積分失敗")
		return
	}

	// Update school total points if user has school
	var user models.User
	if err := tx.Select("school_id").Where("id = ?", userID).First(&user).Error; err == nil && user.SchoolID != nil {
		if err := tx.Model(&models.School{}).
			Where("id = ?", user.SchoolID).
			UpdateColumn("total_points", gorm.Expr("total_points + ?", pointsEarned)).
			Error; err != nil {
			tx.Rollback()
			utils.InternalErrorResponse(c, "更新學校積分失敗")
			return
		}
	}

	// Update plan progress if plan_id provided
	if session.PlanID != nil {
		if err := tx.Model(&models.StudyPlan{}).
			Where("id = ?", session.PlanID).
			UpdateColumns(map[string]interface{}{
				"completed_minutes": gorm.Expr("completed_minutes + ?", req.Minutes),
				"pomodoro_count":    gorm.Expr("pomodoro_count + 1"),
			}).Error; err != nil {
			tx.Rollback()
			utils.InternalErrorResponse(c, "更新計畫進度失敗")
			return
		}

		// Check if plan should be marked complete
		var plan models.StudyPlan
		if err := tx.Where("id = ?", session.PlanID).First(&plan).Error; err == nil {
			plan.CheckAndMarkComplete()
			tx.Save(&plan)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		utils.InternalErrorResponse(c, "提交事務失敗")
		return
	}

	// Load relations
	database.DB.Preload("Plan").Preload("Course").First(&session, session.ID)

	utils.SuccessResponse(c, 201, session, "專注紀錄新增成功")
}

// GetSessionStats retrieves statistics for a given period
func GetSessionStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	period := c.DefaultQuery("period", "month") // week, month, year, lifetime

	var startDate time.Time
	now := time.Now()

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	case "lifetime":
		startDate = time.Time{} // All time
	default:
		startDate = now.AddDate(0, -1, 0) // Default to month
	}

	query := database.DB.Where("user_id = ?", userID)
	if !startDate.IsZero() {
		query = query.Where("date >= ?", startDate.Format("2006-01-02"))
	}

	// Basic stats
	type Stats struct {
		TotalSessions int
		TotalMinutes  int
		TotalPoints   int
		ActiveDays    int64
	}

	var stats Stats
	query.Model(&models.FocusSession{}).Count(&stats.TotalSessions)
	query.Model(&models.FocusSession{}).Select("COALESCE(SUM(minutes), 0)").Scan(&stats.TotalMinutes)
	query.Model(&models.FocusSession{}).Select("COALESCE(SUM(points_earned), 0)").Scan(&stats.TotalPoints)
	query.Model(&models.FocusSession{}).Distinct("date").Count(&stats.ActiveDays)

	// Daily breakdown
	var dailyData []struct {
		Date     string `json:"date"`
		Sessions int    `json:"sessions"`
		Minutes  int    `json:"minutes"`
		Points   int    `json:"points"`
	}
	query.Model(&models.FocusSession{}).
		Select("date, COUNT(*) as sessions, SUM(minutes) as minutes, SUM(points_earned) as points").
		Group("date").
		Order("date").
		Scan(&dailyData)

	// Course breakdown
	var courseData []struct {
		CourseName string `json:"course_name"`
		Minutes    int    `json:"minutes"`
	}
	database.DB.Table("focus_sessions").
		Select("courses.name as course_name, SUM(focus_sessions.minutes) as minutes").
		Joins("LEFT JOIN courses ON focus_sessions.course_id = courses.id").
		Where("focus_sessions.user_id = ?", userID).
		Where("focus_sessions.date >= ?", startDate.Format("2006-01-02")).
		Where("courses.name IS NOT NULL").
		Group("courses.name").
		Order("minutes DESC").
		Scan(&courseData)

	// Calculate percentages
	type CourseBreakdown struct {
		CourseName string  `json:"course_name"`
		Minutes    int     `json:"minutes"`
		Percentage float64 `json:"percentage"`
	}
	var courseBreakdown []CourseBreakdown
	for _, cd := range courseData {
		percentage := 0.0
		if stats.TotalMinutes > 0 {
			percentage = float64(cd.Minutes) / float64(stats.TotalMinutes) * 100
		}
		courseBreakdown = append(courseBreakdown, CourseBreakdown{
			CourseName: cd.CourseName,
			Minutes:    cd.Minutes,
			Percentage: percentage,
		})
	}

	// Calculate current streak
	currentStreak := calculateStreak(userID)

	utils.SuccessResponse(c, 200, gin.H{
		"period":             period,
		"total_sessions":     stats.TotalSessions,
		"total_minutes":      stats.TotalMinutes,
		"total_points":       stats.TotalPoints,
		"active_days":        stats.ActiveDays,
		"current_streak":     currentStreak,
		"daily_breakdown":    dailyData,
		"course_breakdown":   courseBreakdown,
	}, "")
}

// calculateStreak calculates current consecutive days streak
func calculateStreak(userID uuid.UUID) int {
	var dates []string
	database.DB.Model(&models.FocusSession{}).
		Where("user_id = ?", userID).
		Distinct("date").
		Order("date DESC").
		Pluck("date", &dates)

	if len(dates) == 0 {
		return 0
	}

	streak := 0
	today := time.Now().Format("2006-01-02")

	for i, dateStr := range dates {
		expectedDate := time.Now().AddDate(0, 0, -i).Format("2006-01-02")

		if dateStr == expectedDate || (i == 0 && dateStr < today) {
			streak++
		} else {
			break
		}
	}

	return streak
}
