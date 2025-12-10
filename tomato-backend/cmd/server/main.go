package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/config"
	"github.com/yourusername/tomato-backend/internal/database"
	"github.com/yourusername/tomato-backend/internal/handlers"
	"github.com/yourusername/tomato-backend/internal/middleware"
	"github.com/yourusername/tomato-backend/internal/models"
)

func main() {
	// Load configuration
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Auto migrate database
	if err := database.AutoMigrate(
		&models.School{},
		&models.User{},
		&models.Course{},
		&models.StudyPlan{},
		&models.FocusSession{},
		&models.Todo{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize Gin router
	if config.AppConfig.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.CORS.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "Tomato Backend API is running",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.POST("/logout", middleware.AuthMiddleware(), handlers.Logout)
		}

		// Protected routes
		// User routes
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware())
		{
			// TODO: Add user handlers
			// users.GET("/me", handlers.GetMe)
			// users.PUT("/me", handlers.UpdateMe)
			// users.GET("/me/stats", handlers.GetMyStats)
		}

		// Course routes
		courses := v1.Group("/courses")
		courses.Use(middleware.AuthMiddleware())
		{
			courses.GET("", handlers.GetCourses)
			courses.POST("", handlers.CreateCourse)
			courses.GET("/:id", handlers.GetCourse)
			courses.PUT("/:id", handlers.UpdateCourse)
			courses.DELETE("/:id", handlers.DeleteCourse)
		}

		// Study plan routes
		plans := v1.Group("/plans")
		plans.Use(middleware.AuthMiddleware())
		{
			plans.GET("", handlers.GetPlans)
			plans.POST("", handlers.CreatePlan)
			plans.GET("/:id", handlers.GetPlan)
			plans.PUT("/:id", handlers.UpdatePlan)
			plans.DELETE("/:id", handlers.DeletePlan)
			plans.PATCH("/:id/complete", handlers.TogglePlanComplete)
		}

		// Focus session routes
		sessions := v1.Group("/sessions")
		sessions.Use(middleware.AuthMiddleware())
		{
			sessions.GET("", handlers.GetSessions)
			sessions.POST("", handlers.CreateSession)
			sessions.GET("/stats", handlers.GetSessionStats)
		}

		// Todo routes
		todos := v1.Group("/todos")
		todos.Use(middleware.AuthMiddleware())
		{
			todos.GET("", handlers.GetTodos)
			todos.POST("", handlers.CreateTodo)
			todos.GET("/:id", handlers.GetTodo)
			todos.PUT("/:id", handlers.UpdateTodo)
			todos.DELETE("/:id", handlers.DeleteTodo)
			todos.PATCH("/:id/complete", handlers.ToggleTodoComplete)
		}

		// Leaderboard routes
		leaderboard := v1.Group("/leaderboard")
		leaderboard.Use(middleware.AuthMiddleware())
		{
			// TODO: Add leaderboard handlers
			// leaderboard.GET("/schools", handlers.GetSchoolLeaderboard)
			// leaderboard.GET("/schools/:id", handlers.GetSchoolDetails)
			// leaderboard.GET("/me", handlers.GetMyRanking)
		}

		// Friend routes
		friends := v1.Group("/friends")
		friends.Use(middleware.AuthMiddleware())
		{
			// TODO: Add friend handlers
			// friends.GET("", handlers.GetFriends)
			// friends.POST("/request", handlers.SendFriendRequest)
			// friends.GET("/requests", handlers.GetFriendRequests)
			// friends.POST("/accept/:id", handlers.AcceptFriendRequest)
			// friends.POST("/reject/:id", handlers.RejectFriendRequest)
			// friends.DELETE("/:id", handlers.DeleteFriend)
		}
	}

	// Start server
	port := ":" + config.AppConfig.Server.Port
	log.Printf("Server starting on port %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
