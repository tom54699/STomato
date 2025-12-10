package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TodoType string

const (
	TodoTypeHomework TodoType = "homework"
	TodoTypeExam     TodoType = "exam"
	TodoTypeMemo     TodoType = "memo"
)

type Todo struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	User      *User      `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	CourseID  *uuid.UUID `json:"course_id" gorm:"type:uuid"`
	Course    *Course    `json:"course,omitempty" gorm:"foreignKey:CourseID;constraint:OnDelete:SET NULL"`
	Title     string     `json:"title" gorm:"not null"`
	Date      time.Time  `json:"date" gorm:"type:date;not null;index"`
	TodoType  TodoType   `json:"todo_type" gorm:"type:varchar(20);default:'memo';index"`
	Completed bool       `json:"completed" gorm:"default:false;index"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (t *Todo) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
