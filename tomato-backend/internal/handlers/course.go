package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/utils"
	"gorm.io/gorm"
)

type CreateCourseRequest struct {
	Name      string `json:"name" binding:"required"`
	Day       int    `json:"day" binding:"required,min=0,max=6"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
	Location  string `json:"location"`
	Color     string `json:"color"`
}

type UpdateCourseRequest struct {
	Name      string `json:"name"`
	Day       *int   `json:"day"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Location  string `json:"location"`
	Color     string `json:"color"`
}

// GetCourses retrieves all courses for the authenticated user
func GetCourses(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	var courses []models.Course
	if err := database.DB.Where("user_id = ?", userID).Order("day, start_time").Find(&courses).Error; err != nil {
		utils.InternalErrorResponse(c, "查詢課程失敗")
		return
	}

	utils.SuccessResponse(c, 200, courses, "")
}

// CreateCourse creates a new course
func CreateCourse(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	var req CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Set default color if not provided
	if req.Color == "" {
		req.Color = "bg-blue-400"
	}

	course := models.Course{
		UserID:    userID,
		Name:      req.Name,
		Day:       req.Day,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Location:  req.Location,
		Color:     req.Color,
	}

	if err := database.DB.Create(&course).Error; err != nil {
		utils.InternalErrorResponse(c, "課程創建失敗")
		return
	}

	utils.SuccessResponse(c, 201, course, "課程新增成功")
}

// GetCourse retrieves a single course by ID
func GetCourse(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	courseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的課程 ID")
		return
	}

	var course models.Course
	if err := database.DB.Where("id = ? AND user_id = ?", courseID, userID).First(&course).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "課程不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢課程失敗")
		return
	}

	utils.SuccessResponse(c, 200, course, "")
}

// UpdateCourse updates an existing course
func UpdateCourse(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	courseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的課程 ID")
		return
	}

	var req UpdateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Find course
	var course models.Course
	if err := database.DB.Where("id = ? AND user_id = ?", courseID, userID).First(&course).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "課程不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢課程失敗")
		return
	}

	// Update fields
	if req.Name != "" {
		course.Name = req.Name
	}
	if req.Day != nil {
		course.Day = *req.Day
	}
	if req.StartTime != "" {
		course.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		course.EndTime = req.EndTime
	}
	if req.Location != "" {
		course.Location = req.Location
	}
	if req.Color != "" {
		course.Color = req.Color
	}

	if err := database.DB.Save(&course).Error; err != nil {
		utils.InternalErrorResponse(c, "課程更新失敗")
		return
	}

	utils.SuccessResponse(c, 200, course, "課程更新成功")
}

// DeleteCourse deletes a course
func DeleteCourse(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	courseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的課程 ID")
		return
	}

	// Check if course exists and belongs to user
	var course models.Course
	if err := database.DB.Where("id = ? AND user_id = ?", courseID, userID).First(&course).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "課程不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢課程失敗")
		return
	}

	// Delete course
	if err := database.DB.Delete(&course).Error; err != nil {
		utils.InternalErrorResponse(c, "課程刪除失敗")
		return
	}

	utils.SuccessResponse(c, 200, nil, "課程刪除成功")
}
