.PHONY: help run test test-coverage test-auth test-course test-plan test-session test-todo clean docker-up docker-down migrate

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Tomato Backend - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

run: ## Run the server
	go run cmd/server/main.go

build: ## Build the server binary
	go build -o bin/tomato-server cmd/server/main.go

test: ## Run all tests
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh

test-verbose: ## Run all tests with verbose output
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh --verbose

test-coverage: ## Run tests with coverage report
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh --coverage

test-auth: ## Run authentication tests
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh -p handlers -n TestRegister
	@./scripts/run-tests.sh -p handlers -n TestLogin
	@./scripts/run-tests.sh -p handlers -n TestRefreshToken
	@./scripts/run-tests.sh -p handlers -n TestLogout
	@./scripts/run-tests.sh -p handlers -n TestAuthenticationFlow

test-course: ## Run course API tests
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh -p handlers -n TestCourse

test-plan: ## Run study plan API tests
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh -p handlers -n TestPlan

test-session: ## Run focus session API tests
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh -p handlers -n TestSession

test-todo: ## Run todo API tests
	@chmod +x scripts/run-tests.sh
	@./scripts/run-tests.sh -p handlers -n TestTodo

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Stop and remove Docker containers, volumes
	docker-compose down -v

migrate: ## Run database migrations (manual)
	@echo "Migrations are automatically run on server startup"
	@echo "To force migration, run: go run cmd/server/main.go"

clean: ## Clean build artifacts and coverage files
	rm -f coverage.out coverage.html
	rm -rf bin/

deps: ## Install/update dependencies
	go mod download
	go mod tidy

fmt: ## Format code
	go fmt ./...

vet: ## Run go vet
	go vet ./...

lint: ## Run linter (requires golangci-lint)
	golangci-lint run

dev: ## Run in development mode with auto-reload (requires air)
	air

install-tools: ## Install development tools
	@echo "Installing development tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/cosmtrek/air@latest
	@echo "✓ Development tools installed"

setup: deps ## Setup development environment
	@echo "Setting up development environment..."
	@cp -n .env.example .env || true
	@cp -n .env.example .env.test || true
	@echo "✓ Environment files created"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env and .env.test with your configuration"
	@echo "  2. Create PostgreSQL databases:"
	@echo "     psql -U postgres -c 'CREATE DATABASE tomato_db;'"
	@echo "     psql -U postgres -c 'CREATE DATABASE tomato_test;'"
	@echo "  3. Run 'make run' to start the server"
	@echo "  4. Run 'make test' to run tests"

ci: fmt vet test ## Run CI pipeline (format, vet, test)

all: clean deps build test ## Build and test everything
