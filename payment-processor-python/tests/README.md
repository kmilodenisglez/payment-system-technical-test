# Payment Processor — Unit Tests

Comprehensive test suite for the Payment Processor service using pytest.

## Overview

This test suite includes:

- **`test_config.py`** — Tests for environment configuration loading
- **`test_payment_service.py`** — Tests for payment processing logic
- **`test_utils.py`** — Tests for utilities (JSON response, logging)
- **`test_payment_handler.py`** — Tests for HTTP request handling

## Running Tests

### ✅ Recommended: Using Virtual Environment

Best practice is to isolate Python dependencies in a virtual environment.

#### For asdf Users

If you're using `asdf` to manage Python, the setup script automatically detects it:

```bash
cd payment-processor-python

# Just run the setup script — it detects asdf automatically
./scripts/setup_env.sh

# Virtual environment is now active with asdf Python
```

For detailed asdf setup and workflows, see [../ASDF.md](../ASDF.md).

#### Automated Setup (All Users)

```bash
cd payment-processor-python

# Run setup script (creates .venv and installs dependencies)
./scripts/setup_env.sh

# You're done! Virtual environment is now active.
```

#### Manual Setup

```bash
cd payment-processor-python

# Create virtual environment
python -m venv .venv

# Activate (Linux / macOS — with asdf or system Python)
source .venv/bin/activate

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Windows cmd)
.venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements-dev.txt
```

#### 2. Run Tests

```bash
# Make sure venv is activated (you should see (.venv) in your prompt)
./scripts/run_tests.sh

# Or run pytest directly
pytest tests/ -v
```

#### 3. Deactivate Virtual Environment

```bash
deactivate
```

### Quick Start (without venv)

```bash
# Install test dependencies globally
pip install -r requirements-dev.txt

# Run all tests
./scripts/run_tests.sh

# Or directly with pytest
pytest tests/
```

### Test Runners

```bash
# Run all tests with verbose output
./scripts/run_tests.sh

# Run tests and fail on first failure
./scripts/run_tests.sh --fast

# Run tests with coverage report
./scripts/run_tests.sh --cov

# Run specific test by name
./scripts/run_tests.sh -k test_process_returns_payment_result

# Run all tests in a specific file
pytest tests/test_payment_service.py -v
```

## Test Coverage

### Config Tests (`test_config.py`)

| Test | Purpose |
|------|---------|
| `test_default_host` | Verify default HOST is `0.0.0.0` |
| `test_custom_host` | Verify custom HOST from env var |
| `test_default_port` | Verify default PORT is `5000` |
| `test_custom_port` | Verify custom PORT from env var |
| `test_invalid_port_raises_error` | Invalid PORT raises `ValueError` |
| `test_default_log_level` | Verify default LOG_LEVEL is `INFO` |
| `test_custom_log_level` | Verify custom LOG_LEVEL from env var |
| `test_default_approval_rate` | Verify default APPROVAL_RATE is `0.8` |
| `test_custom_approval_rate` | Verify custom APPROVAL_RATE from env var |
| `test_approval_rate_boundary_zero` | APPROVAL_RATE of `0.0` (always decline) |
| `test_approval_rate_boundary_one` | APPROVAL_RATE of `1.0` (always approve) |
| `test_invalid_approval_rate_raises_error` | Invalid APPROVAL_RATE raises `ValueError` |

### Payment Service Tests (`test_payment_service.py`)

| Test | Purpose |
|------|---------|
| `test_process_returns_payment_result` | Response has all required fields |
| `test_process_valid_payment_approved` | Valid payment can be approved |
| `test_process_valid_payment_declined` | Valid payment can be declined |
| `test_process_negative_amount_rejected` | Negative amounts are rejected |
| `test_process_zero_amount_rejected` | Zero amounts are rejected |
| `test_process_small_positive_amount_accepted` | Very small amounts ($0.01) are accepted |
| `test_process_large_amount_accepted` | Large amounts are processed normally |
| `test_process_always_approve` | 100% approval rate (APPROVAL_RATE = 1.0) |
| `test_process_always_decline` | 0% approval rate (APPROVAL_RATE = 0.0) |
| `test_process_transaction_id_format` | Transaction ID format is `txn_<12 hex chars>` |
| `test_process_includes_iso_timestamp` | Response includes ISO 8601 timestamp |
| `test_process_float_and_int_amounts` | Both float and int amounts work |
| `test_process_multiple_calls_different_outcomes` | Stochastic behavior (variable outcomes) |

### Utils Tests (`test_utils.py`)

#### JSON Response

| Test | Purpose |
|------|---------|
| `test_send_json_sets_content_type` | Correct Content-Type header set |
| `test_send_json_sets_content_length` | Content-Length header set |
| `test_send_json_writes_valid_json` | Valid JSON written to response |
| `test_send_json_with_error_response` | Error responses formatted correctly |
| `test_send_json_with_nested_structure` | Nested objects preserved |
| `test_send_json_with_list` | Arrays in response work |

#### Logger

| Test | Purpose |
|------|---------|
| `test_setup_logger_returns_logger` | Logger instance returned |
| `test_setup_logger_has_name` | Logger has provided name |
| `test_logger_can_log_info` | Info level logging works |
| `test_logger_can_log_error` | Error level logging works |
| `test_logger_can_log_debug` | Debug level logging works |
| `test_logger_has_handlers` | Logger has handlers configured |
| `test_logger_stdout_handler` | StreamHandler configured |

### Payment Handler Tests (`test_payment_handler.py`)

| Test | Purpose |
|------|---------|
| `test_get_health_endpoint_success` | `GET /health` returns 200 |
| `test_get_not_found_returns_404` | `GET /unknown` returns 404 |
| `test_post_process_with_valid_json` | `POST /process` with valid JSON works |
| `test_post_process_missing_content_length` | Missing Content-Length header → 400 |
| `test_post_process_invalid_content_length` | Invalid Content-Length → 400 |
| `test_post_process_empty_body` | Empty body (Content-Length: 0) → 400 |
| `test_post_process_invalid_json` | Malformed JSON → 400 |
| `test_post_process_missing_amount_field` | Missing `amount` field → 400 |
| `test_post_process_amount_not_numeric` | Non-numeric amount → 400 |
| `test_post_process_amount_boolean_rejected` | Boolean amount rejected → 400 |
| `test_post_not_found_returns_404` | `POST /unknown` returns 404 |
| `test_utf8_json_parsing` | UTF-8 JSON parsed correctly |
| `test_utf8_decoding_error` | Invalid UTF-8 bytes → 400 |

## Virtual Environment Best Practices

### Why Use Virtual Environment?

✅ **Isolation** — Each project has independent dependencies, preventing conflicts  
✅ **Reproducibility** — Exact same versions run everywhere  
✅ **Cleanliness** — No pollution of system Python (or asdf Python)  
✅ **Easy Cleanup** — Simply delete `.venv/` folder to remove all dependencies  

### Python Version Managers

The setup script works seamlessly with:

- **asdf** — Auto-detects and uses asdf-managed Python
- **pyenv** — Works with system Python
- **System Python** — Falls back to `python3` or `python`
- **Conda / Mamba** — Use `python -m venv` as usual

### .gitignore

The `.venv` directory is automatically ignored (in `.gitignore`), so it won't be committed:

```
.venv/
```

### Workflow Summary

#### With asdf:

```bash
# asdf handles Python version switching

# First time: setup venv
./scripts/setup_env.sh

# Subsequently: just activate
source .venv/bin/activate

# Run tests
./scripts/run_tests.sh

# Done: deactivate
deactivate
```

#### With system Python or other managers:

```bash
# Same workflow
./scripts/setup_env.sh
source .venv/bin/activate
./scripts/run_tests.sh
deactivate
```

---

## Best Practices Implemented

### 1. **Test Organization**
- Grouped tests by module/class
- Clear test naming following `test_<function>_<scenario>` pattern
- Dedicated test files for each component

### 2. **Isolation & Mocking**
- Mocks for external dependencies (logger, payment service)
- Fixtures for common setup (env variables)
- No shared state between tests

### 3. **Comprehensive Coverage**
- Happy path scenarios (valid inputs)
- Error cases (invalid inputs)
- Edge cases (boundary values, type checking)
- Integration scenarios (stochastic behavior)

### 4. **Clear Assertions**
- One assertion per test (when possible)
- Descriptive assertion messages
- Explicit error case validation

### 5. **Configuration**
- `pytest.ini` for test discovery and output formatting
- `conftest.py` for shared fixtures and path setup
- Test markers for categorization (unit, integration)

### 6. **CI/CD Ready**
- Exit codes: `0` (pass) or `1` (fail)
- Machine-readable output (with `--json` flag)
- Coverage reports in HTML and terminal formats
- Color-coded script output

## Example: Running Specific Tests

```bash
# Run all payment service tests
./scripts/run_tests.sh -k payment_service

# Run only approval/decline tests
./scripts/run_tests.sh -k "approved or declined"

# Run tests for the /process endpoint
./scripts/run_tests.sh -k "process"

# Run with full coverage including uncovered lines
./scripts/run_tests.sh --cov
```

## Adding New Tests

1. Create a new test file: `tests/test_<module>.py`
2. Import fixtures from `conftest.py` if needed
3. Use descriptive test names: `test_<what>_<scenario>`
4. Add docstrings explaining the test intent
5. Run tests: `./scripts/run_tests.sh`

### Example Test

```python
def test_new_feature(mock_env_clear):
    """Test description explaining what is being tested."""
    # Arrange
    mock_env_clear.setenv("VAR", "value")
    
    # Act
    result = some_function()
    
    # Assert
    assert result == expected_value
```

## Docker Integration

The test suite runs outside Docker for development. For CI/CD, use:

```bash
docker run -v $(pwd)/payment-processor-python:/app \
  -w /app \
  python:3.12-slim \
  bash -c "pip install -r requirements-dev.txt && pytest tests/"
```

## Coverage Goals

- **Target**: ≥ 80% coverage for core modules
- **View**: `./htmlcov/index.html` after running `--cov`

---

For more information, see the parent [README.md](../README.md) and run `pytest --help` for advanced options.
