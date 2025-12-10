package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	CORS     CORSConfig
	Points   PointsConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	Secret            string
	Expiration        time.Duration
	RefreshExpiration time.Duration
}

type CORSConfig struct {
	AllowedOrigins []string
}

type PointsConfig struct {
	BasePointsPerMinute int
	StreakBonusEnabled  bool
}

var AppConfig *Config

// Load loads configuration from environment variables
func Load() error {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	jwtExpiration, err := time.ParseDuration(getEnv("JWT_EXPIRATION", "24h"))
	if err != nil {
		jwtExpiration = 24 * time.Hour
	}

	jwtRefreshExpiration, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRATION", "168h"))
	if err != nil {
		jwtRefreshExpiration = 168 * time.Hour
	}

	AppConfig = &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "tomato_db"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:            getEnv("JWT_SECRET", ""),
			Expiration:        jwtExpiration,
			RefreshExpiration: jwtRefreshExpiration,
		},
		CORS: CORSConfig{
			AllowedOrigins: strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		},
		Points: PointsConfig{
			BasePointsPerMinute: getEnvAsInt("BASE_POINTS_PER_MINUTE", 10),
			StreakBonusEnabled:  getEnvAsBool("STREAK_BONUS_ENABLED", true),
		},
	}

	// Validate required fields
	if AppConfig.JWT.Secret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	if AppConfig.Database.Password == "" {
		log.Println("Warning: DB_PASSWORD is empty")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}
