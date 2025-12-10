package testutil

import (
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/tomato-backend/internal/models"
	"github.com/yourusername/tomato-backend/internal/utils"
	"gorm.io/gorm"
)

// CreateTestSchool creates a test school
func CreateTestSchool(db *gorm.DB, name string) *models.School {
	school := &models.School{
		Name:        name,
		TotalPoints: 0,
	}
	db.Create(school)
	return school
}

// CreateTestUser creates a test user with hashed password
func CreateTestUser(db *gorm.DB, email, password, name string, schoolID *uuid.UUID) *models.User {
	hashedPassword, _ := utils.HashPassword(password)
	user := &models.User{
		Email:       email,
		Password:    hashedPassword,
		Name:        name,
		SchoolID:    schoolID,
		TotalPoints: 0,
	}
	db.Create(user)
	return user
}

// CreateTestCourse creates a test course for a user
func CreateTestCourse(db *gorm.DB, userID uuid.UUID, name, color string, credits int) *models.Course {
	course := &models.Course{
		UserID:       userID,
		Name:         name,
		Color:        color,
		Credits:      credits,
		StartDate:    time.Now(),
		EndDate:      time.Now().AddDate(0, 4, 0), // 4 months later
		DayOfWeek:    1,                           // Monday
		StartTime:    "09:00",
		EndTime:      "11:00",
		Location:     "測試教室",
		ProfessorName: "測試教授",
	}
	db.Create(course)
	return course
}

// CreateTestStudyPlan creates a test study plan
func CreateTestStudyPlan(db *gorm.DB, userID uuid.UUID, courseID *uuid.UUID, title string, targetMinutes int) *models.StudyPlan {
	plan := &models.StudyPlan{
		UserID:           userID,
		CourseID:         courseID,
		Title:            title,
		Date:             time.Now(),
		StartTime:        "14:00",
		TargetMinutes:    targetMinutes,
		CompletedMinutes: 0,
		PomodoroCount:    0,
		Completed:        false,
		Location:         "圖書館",
	}
	db.Create(plan)
	return plan
}

// CreateTestFocusSession creates a test focus session
func CreateTestFocusSession(db *gorm.DB, userID uuid.UUID, planID, courseID *uuid.UUID, minutes int) *models.FocusSession {
	session := &models.FocusSession{
		UserID:       userID,
		PlanID:       planID,
		CourseID:     courseID,
		Date:         time.Now(),
		Minutes:      minutes,
		PointsEarned: minutes * 10, // Assuming 10 points per minute
		Location:     "圖書館",
	}
	db.Create(session)
	return session
}

// CreateTestTodo creates a test todo
func CreateTestTodo(db *gorm.DB, userID uuid.UUID, courseID *uuid.UUID, title string, todoType models.TodoType) *models.Todo {
	todo := &models.Todo{
		UserID:    userID,
		CourseID:  courseID,
		Title:     title,
		Date:      time.Now().AddDate(0, 0, 1), // Tomorrow
		TodoType:  todoType,
		Completed: false,
	}
	db.Create(todo)
	return todo
}

// CreateCompleteTestData creates a full set of test data
func CreateCompleteTestData(db *gorm.DB) (school *models.School, user *models.User, course *models.Course, plan *models.StudyPlan) {
	// Create school
	school = CreateTestSchool(db, "測試大學")

	// Create user
	user = CreateTestUser(db, "test@example.com", "password123", "測試用戶", &school.ID)

	// Create course
	course = CreateTestCourse(db, user.ID, "測試課程", "#3b82f6", 3)

	// Create study plan
	plan = CreateTestStudyPlan(db, user.ID, &course.ID, "測試計畫", 120)

	return
}
