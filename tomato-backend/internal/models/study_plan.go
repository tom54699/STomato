package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StudyPlan struct {
	ID                uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID            uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	User              *User      `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	CourseID          *uuid.UUID `json:"course_id" gorm:"type:uuid;index"`
	Course            *Course    `json:"course,omitempty" gorm:"foreignKey:CourseID;constraint:OnDelete:SET NULL"`
	Title             string     `json:"title" gorm:"not null"`
	Date              time.Time  `json:"date" gorm:"type:date;not null;index"`
	StartTime         string     `json:"start_time" gorm:"type:time;not null"`
	EndTime           string     `json:"end_time" gorm:"type:time;not null"`
	ReminderTime      *string    `json:"reminder_time" gorm:"type:time"`
	Location          string     `json:"location"`
	TargetMinutes     int        `json:"target_minutes" gorm:"default:0"`
	CompletedMinutes  int        `json:"completed_minutes" gorm:"default:0"`
	PomodoroCount     int        `json:"pomodoro_count" gorm:"default:0"`
	Completed         bool       `json:"completed" gorm:"default:false;index"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

func (sp *StudyPlan) BeforeCreate(tx *gorm.DB) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}
	return nil
}

// CheckAndMarkComplete checks if plan is complete based on target minutes
func (sp *StudyPlan) CheckAndMarkComplete() {
	if sp.TargetMinutes > 0 && sp.CompletedMinutes >= sp.TargetMinutes {
		sp.Completed = true
	}
}
