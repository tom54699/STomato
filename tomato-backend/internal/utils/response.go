package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type ErrorInfo struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// SuccessResponse sends a success response
func SuccessResponse(c *gin.Context, statusCode int, data interface{}, message string) {
	c.JSON(statusCode, Response{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *gin.Context, statusCode int, code string, message string, details interface{}) {
	c.JSON(statusCode, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

// ValidationErrorResponse sends a validation error response
func ValidationErrorResponse(c *gin.Context, details interface{}) {
	ErrorResponse(c, 400, "VALIDATION_ERROR", "請求參數驗證失敗", details)
}

// UnauthorizedResponse sends unauthorized error
func UnauthorizedResponse(c *gin.Context, message string) {
	if message == "" {
		message = "未認證或認證已過期"
	}
	ErrorResponse(c, 401, "UNAUTHORIZED", message, nil)
}

// ForbiddenResponse sends forbidden error
func ForbiddenResponse(c *gin.Context, message string) {
	if message == "" {
		message = "無權限訪問此資源"
	}
	ErrorResponse(c, 403, "FORBIDDEN", message, nil)
}

// NotFoundResponse sends not found error
func NotFoundResponse(c *gin.Context, message string) {
	if message == "" {
		message = "找不到指定的資源"
	}
	ErrorResponse(c, 404, "NOT_FOUND", message, nil)
}

// ConflictResponse sends conflict error
func ConflictResponse(c *gin.Context, message string) {
	if message == "" {
		message = "資源衝突"
	}
	ErrorResponse(c, 409, "CONFLICT", message, nil)
}

// InternalErrorResponse sends internal server error
func InternalErrorResponse(c *gin.Context, message string) {
	if message == "" {
		message = "伺服器內部錯誤"
	}
	ErrorResponse(c, 500, "INTERNAL_ERROR", message, nil)
}

// ParseInt parses string to int
func ParseInt(s string) (int, error) {
	return strconv.Atoi(s)
}
