#!/bin/bash
##############################################################################
# Test runner script for Payment Processor
#
# Usage:
#   ./scripts/run_tests.sh              # Run all tests with verbose output
#   ./scripts/run_tests.sh --cov        # Run tests with coverage report
#   ./scripts/run_tests.sh --fast       # Run tests, fail on first error
#   ./scripts/run_tests.sh -k <test>    # Run specific test by name
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_DIR="${PROJECT_ROOT}"

# Default options
PYTEST_ARGS="--tb=short -v"
SHOW_COVERAGE=false
FAST_FAIL=false
TEST_FILTER=""

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cov)
            SHOW_COVERAGE=true
            shift
            ;;
        --fast)
            FAST_FAIL=true
            PYTEST_ARGS="${PYTEST_ARGS} -x"
            shift
            ;;
        -k)
            TEST_FILTER="$2"
            shift 2
            ;;
        *)
            PYTEST_ARGS="${PYTEST_ARGS} $1"
            shift
            ;;
    esac
done

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Payment Processor — Test Suite${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${YELLOW}⚠️  pytest not found. Installing test dependencies...${NC}"
    cd "${PYTHON_DIR}"
    pip install -q pytest pytest-cov
fi

cd "${PYTHON_DIR}"

# Build test command
TEST_CMD="pytest tests/ ${PYTEST_ARGS}"
if [ -n "${TEST_FILTER}" ]; then
    TEST_CMD="${TEST_CMD} -k ${TEST_FILTER}"
fi

if [ "$SHOW_COVERAGE" = true ]; then
    echo -e "${BLUE}Running tests with coverage...${NC}"
    TEST_CMD="${TEST_CMD} --cov=src --cov-report=term-missing --cov-report=html"
    echo ""
fi

# Run tests
echo -e "${BLUE}Command: ${TEST_CMD}${NC}"
echo ""

if eval "${TEST_CMD}"; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    if [ "$SHOW_COVERAGE" = true ]; then
        echo -e "${BLUE}Coverage report: htmlcov/index.html${NC}"
    fi
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}✗ Tests failed!${NC}"
    echo ""
    exit 1
fi
