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

type CreateTodoRequest struct {
	Title    string            `json:"title" binding:"required"`
	CourseID *string           `json:"course_id"`
	Date     string            `json:"date" binding:"required"` // YYYY-MM-DD
	TodoType models.TodoType   `json:"todo_type" binding:"required,oneof=homework exam memo"`
}

type UpdateTodoRequest struct {
	Title    string            `json:"title"`
	CourseID *string           `json:"course_id"`
	Date     string            `json:"date"`
	TodoType models.TodoType   `json:"todo_type"`
}

type ToggleTodoCompleteRequest struct {
	Completed bool `json:"completed"`
}

// GetTodos retrieves todos with optional filters
func GetTodos(c *gin.Context) {
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

	// Filter by type
	if todoType := c.Query("type"); todoType != "" {
		query = query.Where("todo_type = ?", todoType)
	}

	var todos []models.Todo
	if err := query.Preload("Course").Order("date, created_at").Find(&todos).Error; err != nil {
		utils.InternalErrorResponse(c, "查詢待辦失敗")
		return
	}

	utils.SuccessResponse(c, 200, todos, "")
}

// CreateTodo creates a new todo
func CreateTodo(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	var req CreateTodoRequest
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

	todo := models.Todo{
		UserID:   userID,
		Title:    req.Title,
		Date:     date,
		TodoType: req.TodoType,
	}

	// Set course ID if provided
	if req.CourseID != nil && *req.CourseID != "" {
		courseID, err := uuid.Parse(*req.CourseID)
		if err != nil {
			utils.ValidationErrorResponse(c, "無效的課程 ID")
			return
		}
		todo.CourseID = &courseID
	}

	if err := database.DB.Create(&todo).Error; err != nil {
		utils.InternalErrorResponse(c, "待辦創建失敗")
		return
	}

	// Load course relation
	database.DB.Preload("Course").First(&todo, todo.ID)

	utils.SuccessResponse(c, 201, todo, "待辦新增成功")
}

// GetTodo retrieves a single todo by ID
func GetTodo(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的待辦 ID")
		return
	}

	var todo models.Todo
	if err := database.DB.Preload("Course").Where("id = ? AND user_id = ?", todoID, userID).First(&todo).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "待辦不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢待辦失敗")
		return
	}

	utils.SuccessResponse(c, 200, todo, "")
}

// UpdateTodo updates an existing todo
func UpdateTodo(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的待辦 ID")
		return
	}

	var req UpdateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Find todo
	var todo models.Todo
	if err := database.DB.Where("id = ? AND user_id = ?", todoID, userID).First(&todo).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "待辦不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢待辦失敗")
		return
	}

	// Update fields
	if req.Title != "" {
		todo.Title = req.Title
	}
	if req.CourseID != nil {
		if *req.CourseID == "" {
			todo.CourseID = nil
		} else {
			courseID, err := uuid.Parse(*req.CourseID)
			if err != nil {
				utils.ValidationErrorResponse(c, "無效的課程 ID")
				return
			}
			todo.CourseID = &courseID
		}
	}
	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			utils.ValidationErrorResponse(c, "日期格式錯誤")
			return
		}
		todo.Date = date
	}
	if req.TodoType != "" {
		todo.TodoType = req.TodoType
	}

	if err := database.DB.Save(&todo).Error; err != nil {
		utils.InternalErrorResponse(c, "待辦更新失敗")
		return
	}

	// Load course relation
	database.DB.Preload("Course").First(&todo, todo.ID)

	utils.SuccessResponse(c, 200, todo, "待辦更新成功")
}

// DeleteTodo deletes a todo
func DeleteTodo(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的待辦 ID")
		return
	}

	var todo models.Todo
	if err := database.DB.Where("id = ? AND user_id = ?", todoID, userID).First(&todo).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "待辦不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢待辦失敗")
		return
	}

	if err := database.DB.Delete(&todo).Error; err != nil {
		utils.InternalErrorResponse(c, "待辦刪除失敗")
		return
	}

	utils.SuccessResponse(c, 200, nil, "待辦刪除成功")
}

// ToggleTodoComplete toggles todo completion status
func ToggleTodoComplete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.UnauthorizedResponse(c, "")
		return
	}

	todoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "無效的待辦 ID")
		return
	}

	var req ToggleTodoCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	var todo models.Todo
	if err := database.DB.Where("id = ? AND user_id = ?", todoID, userID).First(&todo).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFoundResponse(c, "待辦不存在")
			return
		}
		utils.InternalErrorResponse(c, "查詢待辦失敗")
		return
	}

	todo.Completed = req.Completed

	if err := database.DB.Save(&todo).Error; err != nil {
		utils.InternalErrorResponse(c, "更新待辦狀態失敗")
		return
	}

	database.DB.Preload("Course").First(&todo, todo.ID)

	utils.SuccessResponse(c, 200, todo, "待辦狀態已更新")
}
