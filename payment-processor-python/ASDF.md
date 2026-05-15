# Payment Processor with asdf

Guide for users managing Python with **asdf** (version manager).

## Quick Start

```bash
cd payment-processor-python

# asdf automatically uses the .python-version file
# If not already installed, install it:
asdf install python

# Now setup the venv
./scripts/setup_env.sh

# Virtual environment is active — run tests!
./scripts/run_tests.sh
```

## Detailed Setup

### 1. Install Python with asdf (if not done yet)

```bash
# Add Python plugin to asdf (if not already added)
asdf plugin add python

# Install Python 3.12.0 (specified in .python-version)
asdf install python

# Or manually specify version
asdf install python 3.12.0
```

### 2. Configure asdf for This Project

```bash
cd payment-processor-python

# asdf automatically reads .python-version file
# Verify asdf is using correct Python:
asdf which python
# Output: /home/user/.asdf/installs/python/3.12.0/bin/python

# Verify Python version:
python --version
# Output: Python 3.12.0
```

### 3. Setup Virtual Environment

```bash
# The setup script detects asdf Python automatically
./scripts/setup_env.sh

# Or manually:
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

### 4. Run Tests

```bash
# Make sure venv is active (should see (.venv) in prompt)
./scripts/run_tests.sh

# Run specific test
./scripts/run_tests.sh -k test_payment_service

# Deactivate venv
deactivate
```

## Project Configuration

### .python-version

This file specifies which Python version to use:

```
3.12.0
```

When you `cd` into this directory, asdf automatically switches to Python 3.12.0.

### Requirements Files

- **requirements.txt** — Empty (stdlib only for production)
- **requirements-dev.txt** — Contains pytest and pytest-cov for testing

## Common Workflows

### First Time Setup

```bash
asdf install python
cd payment-processor-python
./scripts/setup_env.sh
./scripts/run_tests.sh
```

### Daily Usage

```bash
cd payment-processor-python
source .venv/bin/activate
./scripts/run_tests.sh
deactivate
```

### Update Python Version

If you want to use a different Python version:

```bash
# Update .python-version
echo "3.11.0" > .python-version

# Install new version
asdf install python

# Recreate venv
rm -rf .venv
./scripts/setup_env.sh
```

## Troubleshooting

### asdf: command not found

Install asdf from: https://asdf-vm.com/guide/getting-started.html

### Python not found after `asdf install`

Rehash asdf to update shims:

```bash
asdf reshim python
```

### Virtual environment won't activate

Make sure you're in the correct directory:

```bash
cd payment-processor-python
source .venv/bin/activate
```

### Python version not switching

Check asdf is correctly configured:

```bash
asdf which python  # Should show asdf path
python --version   # Should match .python-version
```

If not, try:

```bash
asdf local python 3.12.0
asdf reshim python
```

## Multiple Python Versions

You can work with multiple Python versions simultaneously:

```bash
# List installed versions
asdf list python

# Create separate envs for different versions
asdf local python 3.11.0
python -m venv .venv-3.11
asdf local python 3.12.0
python -m venv .venv-3.12

# Switch between them
source .venv-3.11/bin/activate  # Python 3.11
source .venv-3.12/bin/activate  # Python 3.12
```

## CI/CD Integration

For GitHub Actions or other CI systems using asdf:

```yaml
- name: Setup asdf
  uses: asdf-vm/actions/setup@v2
  
- name: Install Python
  run: |
    asdf plugin add python || true
    asdf install python
    
- name: Install dependencies and run tests
  run: |
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements-dev.txt
    pytest tests/
```

## Resources

- **asdf Documentation**: https://asdf-vm.com/
- **Python Plugin**: https://github.com/asdf-community/asdf-python
- **asdf FAQ**: https://asdf-vm.com/guide/introduction.html#introduction
