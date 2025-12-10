package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/utils"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	Name       string `json:"name" binding:"required"`
	SchoolName string `json:"school_name" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         interface{} `json:"user"`
	Token        string      `json:"token"`
	RefreshToken string      `json:"refresh_token"`
}

// Register handles user registration
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.ConflictResponse(c, "Email 已被註冊")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.InternalErrorResponse(c, "密碼加密失敗")
		return
	}

	// Find or create school
	var school models.School
	err = database.DB.Where("name = ?", req.SchoolName).FirstOrCreate(&school, models.School{
		Name: req.SchoolName,
	}).Error
	if err != nil {
		utils.InternalErrorResponse(c, "學校創建失敗")
		return
	}

	// Create user
	user := models.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Name:         req.Name,
		SchoolID:     &school.ID,
		TotalPoints:  0,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.InternalErrorResponse(c, "用戶創建失敗")
		return
	}

	// Load school relation
	database.DB.Preload("School").First(&user, user.ID)

	// Generate tokens
	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		utils.InternalErrorResponse(c, "Token 生成失敗")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		utils.InternalErrorResponse(c, "Refresh token 生成失敗")
		return
	}

	utils.SuccessResponse(c, 201, AuthResponse{
		User:         user,
		Token:        token,
		RefreshToken: refreshToken,
	}, "註冊成功")
}

// Login handles user login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Find user by email
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.UnauthorizedResponse(c, "Email 或密碼錯誤")
			return
		}
		utils.InternalErrorResponse(c, "查詢用戶失敗")
		return
	}

	// Check password
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		utils.UnauthorizedResponse(c, "Email 或密碼錯誤")
		return
	}

	// Load school relation
	database.DB.Preload("School").First(&user, user.ID)

	// Generate tokens
	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		utils.InternalErrorResponse(c, "Token 生成失敗")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		utils.InternalErrorResponse(c, "Refresh token 生成失敗")
		return
	}

	utils.SuccessResponse(c, 200, AuthResponse{
		User:         user,
		Token:        token,
		RefreshToken: refreshToken,
	}, "登入成功")
}

// RefreshToken handles token refresh
func RefreshToken(c *gin.Context) {
	type RefreshRequest struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Validate refresh token
	claims, err := utils.ValidateToken(req.RefreshToken)
	if err != nil {
		utils.UnauthorizedResponse(c, "無效的 refresh token")
		return
	}

	// Generate new tokens
	token, err := utils.GenerateToken(claims.UserID, claims.Email)
	if err != nil {
		utils.InternalErrorResponse(c, "Token 生成失敗")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(claims.UserID, claims.Email)
	if err != nil {
		utils.InternalErrorResponse(c, "Refresh token 生成失敗")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{
		"token":         token,
		"refresh_token": refreshToken,
	}, "")
}

// Logout handles user logout (client-side token removal)
func Logout(c *gin.Context) {
	utils.SuccessResponse(c, 200, nil, "登出成功")
}
