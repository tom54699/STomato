package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Course struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Name      string    `json:"name" gorm:"not null"`
	Day       int       `json:"day" gorm:"not null;check:day >= 0 AND day <= 6;index"` // 0=Sunday, 6=Saturday
	StartTime string    `json:"start_time" gorm:"type:time;not null"`
	EndTime   string    `json:"end_time" gorm:"type:time;not null"`
	Location  string    `json:"location"`
	Color     string    `json:"color" gorm:"default:'bg-blue-400'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (c *Course) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
