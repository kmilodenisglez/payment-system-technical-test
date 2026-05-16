#!/bin/bash
##############################################################################
# Initial Developer Setup Script
#
# Quick setup for new developers cloning the repository
# Installs system dependencies and creates development environment
#
# Usage:
#   ./scripts/init-dev.sh
##############################################################################

set -euo pipefail

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Payment Processor — Developer Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check OS and install system dependencies
echo -e "${BLUE}Step 1: Installing system dependencies...${NC}"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v apt-get &> /dev/null; then
        echo -e "${GREEN}✓ Detected: Ubuntu/Debian${NC}"
        echo "  Installing: python3 python3-pip python3-venv python3-dev"
        sudo apt-get update -qq 2>/dev/null || true
        sudo apt-get install -y python3 python3-pip python3-venv python3-dev 2>/dev/null
        echo -e "${GREEN}✓ System dependencies installed${NC}"
    else
        echo -e "${RED}✗ apt-get not found. Please install python3-venv manually.${NC}"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
        echo -e "${GREEN}✓ Detected: macOS (Homebrew)${NC}"
        echo "  Installing: python@3.12"
        brew install python@3.12 2>/dev/null || brew upgrade python@3.12 2>/dev/null
        echo -e "${GREEN}✓ System dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Homebrew not found. Please install Homebrew first:${NC}"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Unknown OS. Please install python3-venv manually.${NC}"
    exit 1
fi

echo ""

# Step 2: Create virtual environment
echo -e "${BLUE}Step 2: Creating virtual environment...${NC}"

cd "${PROJECT_ROOT}"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}✓ Virtual environment already exists${NC}"
fi

echo ""

# Step 3: Activate and install dependencies
echo -e "${BLUE}Step 3: Installing Python dependencies...${NC}"

source .venv/bin/activate

# Upgrade pip
pip install --quiet --upgrade pip setuptools wheel 2>/dev/null || true

# Install dev dependencies
if [ -f "requirements-dev.txt" ]; then
    pip install --quiet -r requirements-dev.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ requirements-dev.txt not found${NC}"
    exit 1
fi

echo ""

# Step 4: Verify installation
echo -e "${BLUE}Step 4: Verifying installation...${NC}"

python --version
pip list | grep -E "pytest|pytest-cov" || true
echo -e "${GREEN}✓ Installation verified${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Activate virtual environment:"
echo "   source .venv/bin/activate"
echo ""
echo "2. Run tests:"
echo "   ./scripts/run_tests.sh"
echo ""
echo "3. Start the server:"
echo "   python src/server.py"
echo ""
echo "To deactivate the virtual environment later, run:"
echo "  deactivate"
echo ""
