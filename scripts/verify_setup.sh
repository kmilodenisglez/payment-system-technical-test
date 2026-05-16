#!/bin/bash
##############################################################################
# Setup Verification Script
#
# Checks that the payment system is set up correctly
# Run after initial setup: bash scripts/verify_setup.sh
##############################################################################

set -uo pipefail  # Allow errors but fail on undefined variables

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️${NC}  $1"
    ((WARNINGS++))
}

check_command() {
    local cmd=$1
    local min_version=$2
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        pass "$cmd installed: $version"
    else
        fail "$cmd not found"
    fi
}

check_file() {
    local file=$1
    if [ -f "$file" ]; then
        pass "Found: $file"
    else
        fail "Missing: $file"
    fi
}

check_directory() {
    local dir=$1
    if [ -d "$dir" ]; then
        pass "Found directory: $dir"
    else
        fail "Missing directory: $dir"
    fi
}

check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        pass "$name is running"
        return 0
    else
        fail "$name is not responding (check if running)"
        return 1
    fi
}

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Payment System — Setup Verification${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
echo -e "${BLUE}1. System Requirements${NC}"
echo "────────────────────────────────────────────────────────────────"

check_command "node" "20" || true
check_command "npm" "10" || true
check_command "python" "3" || true
check_command "docker" "24" || true

# Check for docker-compose (may be docker-compose or docker compose)
if command -v docker-compose &> /dev/null; then
    dc_version=$(docker-compose --version 2>&1 | head -n1)
    pass "docker-compose installed: $dc_version"
elif command -v docker &> /dev/null && docker compose version > /dev/null 2>&1; then
    dc_version=$(docker compose version 2>&1 | head -n1 | grep -v "Executing external" || echo "Docker Compose")
    pass "docker compose installed: $dc_version"
else
    warn "docker-compose or docker compose not found"
fi

echo ""

# ============================================================================
echo -e "${BLUE}2. Project Structure${NC}"
echo "────────────────────────────────────────────────────────────────"

check_directory "api-gateway-node" || true
check_directory "payment-processor-python" || true
check_directory "postman" || true
check_file "README.md" || true
check_file "docker-compose.yml" || true
check_file ".gitignore" || true

echo ""

# ============================================================================
echo -e "${BLUE}3. Node.js Setup${NC}"
echo "────────────────────────────────────────────────────────────────"

if [ -d "api-gateway-node" ]; then
    if [ -f "api-gateway-node/package.json" ]; then
        pass "Found: api-gateway-node/package.json"
    else
        fail "Missing: api-gateway-node/package.json"
    fi
    
    if [ -d "api-gateway-node/node_modules" ]; then
        pass "Found: api-gateway-node/node_modules"
    else
        warn "node_modules not installed (run: cd api-gateway-node && npm install)"
    fi
    
    if [ -f "api-gateway-node/.env" ] || [ -f "api-gateway-node/.env.example" ]; then
        pass "Found: api-gateway-node environment file"
    else
        warn "Missing: api-gateway-node/.env or .env.example"
    fi
    
    if [ -f "api-gateway-node/tsconfig.json" ]; then
        pass "Found: api-gateway-node/tsconfig.json"
    else
        fail "Missing: api-gateway-node/tsconfig.json"
    fi
fi

echo ""

# ============================================================================
echo -e "${BLUE}4. Python Setup${NC}"
echo "────────────────────────────────────────────────────────────────"

if [ -d "payment-processor-python" ]; then
    if [ -f "payment-processor-python/.python-version" ]; then
        py_version=$(cat payment-processor-python/.python-version)
        pass "Found: .python-version ($py_version)"
    else
        warn "Missing: payment-processor-python/.python-version"
    fi
    
    if [ -d "payment-processor-python/.venv" ]; then
        pass "Found: payment-processor-python/.venv"
        
        if [ -f "payment-processor-python/.venv/bin/activate" ]; then
            pass "Virtual environment is configured"
        else
            fail "Virtual environment not properly configured"
        fi
    else
        warn "Python venv not created (run: cd payment-processor-python && ./scripts/init-dev.sh)"
    fi
    
    if [ -f "payment-processor-python/requirements-dev.txt" ]; then
        pass "Found: payment-processor-python/requirements-dev.txt"
    else
        fail "Missing: payment-processor-python/requirements-dev.txt"
    fi
    
    if [ -f "payment-processor-python/scripts/init-dev.sh" ]; then
        pass "Found: payment-processor-python/scripts/init-dev.sh"
        
        if [ -x "payment-processor-python/scripts/init-dev.sh" ]; then
            pass "init-dev.sh is executable"
        else
            warn "init-dev.sh not executable (run: chmod +x payment-processor-python/scripts/init-dev.sh)"
        fi
    else
        fail "Missing: payment-processor-python/scripts/init-dev.sh"
    fi
fi

echo ""

# ============================================================================
echo -e "${BLUE}5. Database${NC}"
echo "────────────────────────────────────────────────────────────────"

if command -v psql &> /dev/null; then
    POSTGRES_USER="${POSTGRES_USER:-payment_user}"
    POSTGRES_DB="${POSTGRES_DB:-payment_db}"
    if psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" > /dev/null 2>&1; then
        pass "PostgreSQL connection successful"
    else
        warn "PostgreSQL not accessible (may not be running)"
    fi
else
    warn "psql not found (use Docker for database)"
fi

echo ""

# ============================================================================
echo -e "${BLUE}6. Services Status${NC}"
echo "────────────────────────────────────────────────────────────────"

echo "Checking if services are running (if using Docker or local start)..."

check_service "http://localhost:3000/health" "API Gateway (localhost:3000)" || true
check_service "http://localhost:5000/health" "Python Processor (localhost:5000)" || true

echo ""

# ============================================================================
echo -e "${BLUE}7. Documentation${NC}"
echo "────────────────────────────────────────────────────────────────"

check_file "README.md" || true
check_file "GETTING_STARTED.md" || true
check_file "CONTRIBUTING.md" || true
check_file "TROUBLESHOOTING.md" || true

echo ""

# ============================================================================
echo -e "${BLUE}8. Configuration Files${NC}"
echo "────────────────────────────────────────────────────────────────"

check_file "docker-compose.yml" || true
check_file "postman/payment-system.postman_collection.json" || true
check_file ".gitignore" || true

if [ -f "api-gateway-node/.env" ]; then
    pass "Found: api-gateway-node/.env (configured)"
elif [ -f "api-gateway-node/.env.example" ]; then
    warn "Found .env.example but no .env file"
fi

if [ -f "payment-processor-python/.env" ]; then
    pass "Found: payment-processor-python/.env (configured)"
elif [ -f "payment-processor-python/.env.example" ]; then
    warn "Found .env.example but no .env file"
fi

echo ""

# ============================================================================
echo -e "${BLUE}9. Test Suites${NC}"
echo "────────────────────────────────────────────────────────────────"

if [ -d "api-gateway-node/tests" ] || [ -f "api-gateway-node/vitest.config.ts" ]; then
    pass "Found: api-gateway-node test suite"
else
    warn "Node.js tests not found"
fi

if [ -d "payment-processor-python/tests" ]; then
    pass "Found: payment-processor-python/tests"
else
    warn "Python tests not found"
fi

echo ""

# ============================================================================
echo -e "${BLUE}10. Scripts${NC}"
echo "────────────────────────────────────────────────────────────────"

check_file "payment-processor-python/scripts/setup_env.sh" || true
check_file "payment-processor-python/scripts/init-dev.sh" || true
check_file "payment-processor-python/scripts/run_tests.sh" || true

echo ""

# ============================================================================
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Verification Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! System is ready.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  System is mostly ready, but some warnings should be addressed.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Setup incomplete. Please address the failures above.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check GETTING_STARTED.md for setup instructions"
    echo "2. Check TROUBLESHOOTING.md for common issues"
    echo "3. Run: docker compose up --build"
    exit 1
fi

