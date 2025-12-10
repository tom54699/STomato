package testutil

import (
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/yourusername/tomato-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var TestDB *gorm.DB

// SetupTestDB initializes a test database connection
func SetupTestDB(t *testing.T) *gorm.DB {
	// Load test environment variables
	_ = godotenv.Load("../../.env.test")
	if _, err := os.Stat(".env.test"); err == nil {
		_ = godotenv.Load(".env.test")
	}

	// Get test database configuration
	dbHost := getEnv("TEST_DB_HOST", "localhost")
	dbPort := getEnv("TEST_DB_PORT", "5432")
	dbUser := getEnv("TEST_DB_USER", "postgres")
	dbPassword := getEnv("TEST_DB_PASSWORD", "postgres")
	dbName := getEnv("TEST_DB_NAME", "tomato_test")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	// Connect to test database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // Silent mode for tests
	})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	TestDB = db
	return db
}

// MigrateTestDB runs migrations on test database
func MigrateTestDB(t *testing.T, db *gorm.DB) {
	err := db.AutoMigrate(
		&models.School{},
		&models.User{},
		&models.Course{},
		&models.StudyPlan{},
		&models.FocusSession{},
		&models.Todo{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}
}

// CleanupTestDB clears all data from test database
func CleanupTestDB(t *testing.T, db *gorm.DB) {
	// Delete in reverse order to handle foreign keys
	tables := []interface{}{
		&models.FocusSession{},
		&models.Todo{},
		&models.StudyPlan{},
		&models.Course{},
		&models.User{},
		&models.School{},
	}

	for _, table := range tables {
		if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(table).Error; err != nil {
			log.Printf("Warning: Failed to clean table %T: %v", table, err)
		}
	}
}

// TeardownTestDB closes test database connection
func TeardownTestDB(db *gorm.DB) {
	sqlDB, err := db.DB()
	if err != nil {
		return
	}
	sqlDB.Close()
}

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
