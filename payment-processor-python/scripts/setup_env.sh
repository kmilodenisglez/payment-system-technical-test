#!/bin/bash
##############################################################################
# Setup script for Payment Processor development environment
#
# Creates and activates Python virtual environment with all dependencies
#
# Works with:
#   - System Python
#   - asdf (version manager)
#   - pyenv
#   - Any Python distribution
#
# Usage:
#   ./scripts/setup_env.sh              # Create and activate venv
#   source .venv/bin/activate           # Manually activate after first run
##############################################################################

set -euo pipefail

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${PROJECT_ROOT}/.venv"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Payment Processor — Development Environment Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Detect available Python
detect_python() {
    local python_cmd=""

    # Check for asdf-managed Python
    if command -v asdf &> /dev/null && asdf which python &> /dev/null 2>&1; then
        python_cmd="$(asdf which python)"
        echo -e "${GREEN}✓ Detected asdf-managed Python${NC}"
    # Check for asdf python3
    elif command -v asdf &> /dev/null && asdf which python3 &> /dev/null 2>&1; then
        python_cmd="$(asdf which python3)"
        echo -e "${GREEN}✓ Detected asdf-managed Python3${NC}"
    # Check for system Python 3
    elif command -v python3 &> /dev/null; then
        python_cmd="python3"
    # Fallback to python
    elif command -v python &> /dev/null; then
        python_cmd="python"
    else
        return 1
    fi

    echo "${python_cmd}"
}

# Find Python
echo -e "${BLUE}Checking Python installation...${NC}"
if PYTHON_CMD=$(detect_python); then
    PYTHON_VERSION=$(${PYTHON_CMD} --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓ Using: ${PYTHON_CMD}${NC}"
    echo -e "${GREEN}✓ Version: ${PYTHON_VERSION}${NC}"
else
    echo -e "${RED}✗ Python not found${NC}"
    echo ""
    echo "Install Python using:"
    echo "  asdf install python 3.12.0 && asdf local python 3.12.0"
    echo "  OR"
    echo "  sudo apt-get install python3"
    echo "  OR"
    echo "  brew install python"
    exit 1
fi
echo ""

# Check Python version (must be 3.10+)
PYTHON_MAJOR=$(echo ${PYTHON_VERSION} | cut -d. -f1)
PYTHON_MINOR=$(echo ${PYTHON_VERSION} | cut -d. -f2)
if [ "${PYTHON_MAJOR}" -lt 3 ] || ([ "${PYTHON_MAJOR}" -eq 3 ] && [ "${PYTHON_MINOR}" -lt 10 ]); then
    echo -e "${YELLOW}⚠️  Python 3.10+ recommended (found ${PYTHON_VERSION})${NC}"
    echo ""
fi

# Create virtual environment
if [ ! -d "${VENV_DIR}" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    if ${PYTHON_CMD} -m venv "${VENV_DIR}" 2>/dev/null; then
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    else
        echo -e "${RED}✗ Failed to create virtual environment${NC}"
        echo ""
        echo "This is usually because venv support is missing. Try:"
        echo ""
        echo -e "${YELLOW}Option 1: Using asdf (recommended)${NC}"
        echo "  asdf install python 3.12.0"
        echo "  asdf local python 3.12.0"
        echo "  ./scripts/setup_env.sh"
        echo ""
        echo -e "${YELLOW}Option 2: Ubuntu/Debian${NC}"
        echo "  sudo apt-get install python3-venv"
        echo "  ./scripts/setup_env.sh"
        echo ""
        echo -e "${YELLOW}Option 3: macOS with Homebrew${NC}"
        echo "  brew install python@3.12"
        echo "  /usr/local/opt/python@3.12/libexec/bin/python -m venv .venv"
        echo ""
        exit 1
    fi
else
    echo -e "${YELLOW}✓ Virtual environment already exists${NC}"
fi
echo ""

# Activate venv
echo -e "${BLUE}Activating virtual environment...${NC}"
if source "${VENV_DIR}/bin/activate"; then
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${RED}✗ Failed to activate virtual environment${NC}"
    exit 1
fi
echo ""

# Upgrade pip, setuptools, wheel
echo -e "${BLUE}Upgrading pip and build tools...${NC}"
pip install --quiet --upgrade pip setuptools wheel 2>/dev/null || true
echo -e "${GREEN}✓ pip, setuptools, wheel upgraded${NC}"
echo ""

# Install dev dependencies
if [ -f "${PROJECT_ROOT}/requirements-dev.txt" ]; then
    echo -e "${BLUE}Installing development dependencies...${NC}"
    if pip install --quiet -r "${PROJECT_ROOT}/requirements-dev.txt"; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some dependencies may have failed to install${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  requirements-dev.txt not found${NC}"
fi

# Display activation instructions
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Virtual environment is now ${GREEN}active${NC}."
echo -e "You should see ${YELLOW}(.venv)${NC} in your shell prompt."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "  Run tests:"
echo -e "    ${BLUE}./scripts/run_tests.sh${NC}"
echo ""
echo "  Run specific test:"
echo -e "    ${BLUE}./scripts/run_tests.sh -k test_process${NC}"
echo ""
echo "  Deactivate when done:"
echo -e "    ${BLUE}deactivate${NC}"
echo ""
echo -e "${YELLOW}To activate in future sessions:${NC}"
echo ""
echo -e "  ${BLUE}source .venv/bin/activate${NC}"
echo ""
