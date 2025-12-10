package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email       string     `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Name        string     `json:"name" gorm:"not null"`
	SchoolID    *uuid.UUID `json:"school_id" gorm:"type:uuid"`
	School      *School    `json:"school,omitempty" gorm:"foreignKey:SchoolID"`
	TotalPoints int        `json:"total_points" gorm:"default:0;index"`
	AvatarURL   string     `json:"avatar_url"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type School struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"uniqueIndex;not null"`
	TotalPoints  int       `json:"total_points" gorm:"default:0;index:idx_schools_points"`
	StudentCount int       `json:"student_count" gorm:"default:0"`
	LogoURL      string    `json:"logo_url"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (s *School) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
