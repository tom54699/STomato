#!/bin/bash

# Tomato Backend Test Runner
# This script runs all tests with proper environment setup

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Tomato Backend Test Runner${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go is not installed${NC}"
    echo "Please install Go 1.21 or later"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL might not be running${NC}"
    echo "Make sure PostgreSQL is running before running tests"
    echo ""
fi

# Load test environment variables
if [ -f .env.test ]; then
    export $(cat .env.test | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Loaded test environment variables${NC}"
else
    echo -e "${YELLOW}Warning: .env.test not found, using defaults${NC}"
fi

# Create test database if it doesn't exist
echo -e "\n${YELLOW}Setting up test database...${NC}"
if command -v psql &> /dev/null; then
    PGPASSWORD=${TEST_DB_PASSWORD:-postgres} psql -h ${TEST_DB_HOST:-localhost} -U ${TEST_DB_USER:-postgres} -tc "SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME:-tomato_test}'" | grep -q 1 || \
    PGPASSWORD=${TEST_DB_PASSWORD:-postgres} psql -h ${TEST_DB_HOST:-localhost} -U ${TEST_DB_USER:-postgres} -c "CREATE DATABASE ${TEST_DB_NAME:-tomato_test};"
    echo -e "${GREEN}✓ Test database ready${NC}"
else
    echo -e "${YELLOW}Warning: psql not found, skipping database creation${NC}"
fi

echo ""

# Parse command line arguments
TEST_PACKAGE=""
TEST_NAME=""
COVERAGE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --package|-p)
            TEST_PACKAGE="$2"
            shift 2
            ;;
        --name|-n)
            TEST_NAME="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -c, --coverage    Generate coverage report"
            echo "  -v, --verbose     Verbose output"
            echo "  -p, --package     Run tests for specific package (e.g., handlers)"
            echo "  -n, --name        Run specific test (e.g., TestRegister)"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Run all tests"
            echo "  $0 --coverage               # Run all tests with coverage"
            echo "  $0 -p handlers              # Run handler tests only"
            echo "  $0 -p handlers -n TestLogin # Run specific test"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build test command
TEST_CMD="go test"

if [ -n "$TEST_PACKAGE" ]; then
    TEST_CMD="$TEST_CMD ./internal/$TEST_PACKAGE"
else
    TEST_CMD="$TEST_CMD ./..."
fi

if [ -n "$TEST_NAME" ]; then
    TEST_CMD="$TEST_CMD -run $TEST_NAME"
fi

if [ "$VERBOSE" = true ]; then
    TEST_CMD="$TEST_CMD -v"
fi

if [ "$COVERAGE" = true ]; then
    TEST_CMD="$TEST_CMD -coverprofile=coverage.out -covermode=atomic"
fi

# Add timeout
TEST_CMD="$TEST_CMD -timeout 5m"

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
echo -e "${YELLOW}Command: $TEST_CMD${NC}"
echo ""

if eval $TEST_CMD; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ All tests passed!${NC}"
    echo -e "${GREEN}========================================${NC}"

    # Generate coverage report if requested
    if [ "$COVERAGE" = true ]; then
        echo ""
        echo -e "${YELLOW}Generating coverage report...${NC}"
        go tool cover -func=coverage.out | tail -n 1

        # Generate HTML coverage report
        go tool cover -html=coverage.out -o coverage.html
        echo -e "${GREEN}✓ Coverage report generated: coverage.html${NC}"

        # Open coverage report in browser (optional)
        # Uncomment the line below to auto-open the report
        # open coverage.html 2>/dev/null || xdg-open coverage.html 2>/dev/null
    fi

    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ✗ Tests failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
