package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/utils"
	"gorm.io/gorm"
)

type CreatePlanRequest struct {
	Title          string  `json:"title" binding:"required"`
	CourseID       *string `json:"course_id"`
	Date           string  `json:"date" binding:"required"` // YYYY-MM-DD
	StartTime      string  `json:"start_time" binding:"required"`
	EndTime        string  `json:"end_time" binding:"required"`
	ReminderTime   *string `json:"reminder_time"`
	Location       string  `json:"location"`
	TargetMinutes  int     `json:"target_minutes"`
}

type UpdatePlanRequest struct {
	Title          string  `json:"title"`
	CourseID       *string `json:"course_id"`
	Date           string  `json:"date"`
	StartTime      string  `json:"start_time"`
	EndTime        string  `json:"end_time"`
	ReminderTime   *string `json:"reminder_time"`
	Location       string  `json:"location"`
	TargetMinutes  *int    `json:"target_minutes"`
}

type ToggleCompleteRequest struct {
	Completed bool `json:"completed"`
}

// GetPlans retrieves study plans with optional filters
func GetPlans(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	query := database.DB.Where("user_id = ?", userID)

	// Filter by date
	if date := c.Query("date"); date != "" {
		query = query.Where("date = ?", date)
	}

	// Filter by date range
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	// Filter by completion status
	if completed := c.Query("completed"); completed != "" {
		query = query.Where("completed = ?", completed == "true")
	}

	var plans []models.StudyPlan
	if err := query.Preload("Course").Order("date, start_time").Find(&plans).Error; err != nil {
		utils.InternalErrorResponse(c, "查詢計畫失敗")
		return
	}

	utils.SuccessResponse(c, 200, plans, "")
}

// CreatePlan creates a new study plan
func CreatePlan(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	var req CreatePlanRequest
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

	plan := models.StudyPlan{
		UserID:        userID,
		Title:         req.Title,
		Date:          date,
		StartTime:     req.StartTime,
		EndTime:       req.EndTime,
		ReminderTime:  req.ReminderTime,
		Location:      req.Location,
		TargetMinutes: req.TargetMinutes,
	}

	// Set course ID if provided
	if req.CourseID != nil && *req.CourseID != "" {
		courseID, err := uuid.Parse(*req.CourseID)
		if err != nil {
			utils.ValidationErrorResponse(c, "無效的課程 ID")
			return
		}
		plan.CourseID = &courseID
	}

	if err := database.DB.Create(&plan).Error; err != nil {
		utils.InternalErrorResponse(c, "計畫創建失敗")
		return
	}

	// Load course relation
	database.DB.Preload("Course").First(&plan, plan.ID)

	utils.SuccessResponse(c, 201, plan, "計畫新增成功")
}

// GetPlan retrieves a single plan by ID
func GetPlan(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的計畫 ID")
		return
	}

	var plan models.StudyPlan
	if err := database.DB.Preload("Course").Where("id = ? AND user_id = ?", planID, userID).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "計畫不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢計畫失敗")
		return
	}

	utils.SuccessResponse(c, 200, plan, "")
}

// UpdatePlan updates an existing study plan
func UpdatePlan(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的計畫 ID")
		return
	}

	var req UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Find plan
	var plan models.StudyPlan
	if err := database.DB.Where("id = ? AND user_id = ?", planID, userID).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "計畫不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢計畫失敗")
		return
	}

	// Update fields
	if req.Title != "" {
		plan.Title = req.Title
	}
	if req.CourseID != nil {
		if *req.CourseID == "" {
			plan.CourseID = nil
		} else {
			courseID, err := uuid.Parse(*req.CourseID)
			if err != nil {
				utils.ValidationErrorResponse(c, "無效的課程 ID")
				return
			}
			plan.CourseID = &courseID
		}
	}
	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			utils.ValidationErrorResponse(c, "日期格式錯誤")
			return
		}
		plan.Date = date
	}
	if req.StartTime != "" {
		plan.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		plan.EndTime = req.EndTime
	}
	if req.ReminderTime != nil {
		plan.ReminderTime = req.ReminderTime
	}
	if req.Location != "" {
		plan.Location = req.Location
	}
	if req.TargetMinutes != nil {
		plan.TargetMinutes = *req.TargetMinutes
	}

	if err := database.DB.Save(&plan).Error; err != nil {
		utils.InternalErrorResponse(c, "計畫更新失敗")
		return
	}

	// Load course relation
	database.DB.Preload("Course").First(&plan, plan.ID)

	utils.SuccessResponse(c, 200, plan, "計畫更新成功")
}

// DeletePlan deletes a study plan
func DeletePlan(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的計畫 ID")
		return
	}

	var plan models.StudyPlan
	if err := database.DB.Where("id = ? AND user_id = ?", planID, userID).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "計畫不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢計畫失敗")
		return
	}

	if err := database.DB.Delete(&plan).Error; err != nil {
		utils.InternalErrorResponse(c, "計畫刪除失敗")
		return
	}

	utils.SuccessResponse(c, 200, nil, "計畫刪除成功")
}

// TogglePlanComplete toggles plan completion status
func TogglePlanComplete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	planID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的計畫 ID")
		return
	}

	var req ToggleCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	var plan models.StudyPlan
	if err := database.DB.Where("id = ? AND user_id = ?", planID, userID).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "計畫不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢計畫失敗")
		return
	}

	plan.Completed = req.Completed

	if err := database.DB.Save(&plan).Error; err != nil {
		utils.InternalErrorResponse(c, "更新計畫狀態失敗")
		return
	}

	database.DB.Preload("Course").First(&plan, plan.ID)

	utils.SuccessResponse(c, 200, plan, "計畫狀態已更新")
}
