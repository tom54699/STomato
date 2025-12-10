package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FocusSession struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	User         *User      `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	PlanID       *uuid.UUID `json:"plan_id" gorm:"type:uuid;index"`
	Plan         *StudyPlan `json:"plan,omitempty" gorm:"foreignKey:PlanID;constraint:OnDelete:SET NULL"`
	CourseID     *uuid.UUID `json:"course_id" gorm:"type:uuid"`
	Course       *Course    `json:"course,omitempty" gorm:"foreignKey:CourseID;constraint:OnDelete:SET NULL"`
	Date         time.Time  `json:"date" gorm:"type:date;not null;index"`
	Minutes      int        `json:"minutes" gorm:"not null"`
	PointsEarned int        `json:"points_earned" gorm:"default:0"`
	Location     string     `json:"location"`
	CreatedAt    time.Time  `json:"created_at" gorm:"index"`
}

func (fs *FocusSession) BeforeCreate(tx *gorm.DB) error {
	if fs.ID == uuid.Nil {
		fs.ID = uuid.New()
	}
	return nil
}
