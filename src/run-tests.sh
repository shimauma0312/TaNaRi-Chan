#!/bin/bash

# Error Handler Test Runner Script
# 
# Features:
# - Run error handler tests
# - Generate coverage report
# - Display test results
# 
# Usage:
# ./run-tests.sh [options]
# Options:
#   --watch    Run tests in watch mode
#   --coverage Run tests with coverage report
#   --help     Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Change to src directory
cd "$(dirname "$0")"

print_status "Checking if dependencies are installed..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Check if Jest is installed
if ! npm list jest &> /dev/null; then
    print_warning "Jest not found. Installing test dependencies..."
    npm install --save-dev jest @types/jest ts-jest jest-environment-node @testing-library/jest-dom @testing-library/react
fi

# Parse command line arguments
WATCH_MODE=false
COVERAGE_MODE=false
HELP_MODE=false

for arg in "$@"; do
    case $arg in
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --coverage)
            COVERAGE_MODE=true
            shift
            ;;
        --help)
            HELP_MODE=true
            shift
            ;;
        *)
            print_error "Unknown option: $arg"
            HELP_MODE=true
            ;;
    esac
done

# Show help if requested
if [ "$HELP_MODE" = true ]; then
    echo "Error Handler Test Runner"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --watch       Run tests in watch mode"
    echo "  --coverage    Run tests with coverage report"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run tests once"
    echo "  $0 --watch           # Run tests in watch mode"
    echo "  $0 --coverage        # Run tests with coverage"
    exit 0
fi

print_status "Running error handler tests..."

# Build the test command
TEST_CMD="npm test"

if [ "$WATCH_MODE" = true ]; then
    TEST_CMD="npm run test:watch"
    print_status "Running in watch mode..."
elif [ "$COVERAGE_MODE" = true ]; then
    TEST_CMD="npm run test:coverage"
    print_status "Running with coverage report..."
fi

# Execute the test command
if eval $TEST_CMD; then
    print_status "All tests passed successfully!"
    
    if [ "$COVERAGE_MODE" = true ]; then
        print_status "Coverage report generated in coverage/ directory"
        if command -v open &> /dev/null; then
            open coverage/lcov-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open coverage/lcov-report/index.html
        else
            print_status "Open coverage/lcov-report/index.html to view detailed coverage report"
        fi
    fi
    
    exit 0
else
    print_error "Some tests failed!"
    exit 1
fi
