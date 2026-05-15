# Payment System — Technical Test

A classroom-ready payment system demonstrating clean architecture, service collaboration, and REST API best practices.

```
┌────────────────────┐
│  Client / Postman  │
└─────────┬──────────┘
          │ HTTP
          ▼
┌─────────────────────────────────┐
│  Node.js API Gateway            │
│  Fastify · TypeScript · Prisma  │
│  Swagger UI → /docs             │
└──────┬──────────────┬───────────┘
       │              │ HTTP POST /process
       │              ▼
       │     ┌──────────────────────┐
       │     │  Python Processor    │
       │     │  stdlib · no deps    │
       │     │  80 % approved       │
       │     └──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  PostgreSQL 16       │
│  users · cards       │
│  payments            │
└──────────────────────┘
```

---

## Tech Stack

| Layer            | Technology                                    |
|------------------|-----------------------------------------------|
| REST API         | Node.js 20 · Fastify v5 · TypeScript 6        |
| ORM              | Prisma v6                                     |
| Validation       | TypeBox (JSON Schema + TS types)              |
| API Docs         | @fastify/swagger + Swagger UI                 |
| Logger           | Pino (structured JSON) + pino-pretty          |
| Database         | PostgreSQL 16                                 |
| Payment Service  | Python 3.12 · stdlib only (`http.server`)     |
| Infrastructure   | Docker · Docker Compose                       |

---

## Project Structure

```
payment-system-technical-test/
├── api-gateway-node/          # Node.js REST API (Fastify + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema & migrations
│   │   └── seed.ts            # Demo data (type-safe)
│   ├── src/
│   │   ├── config/            # env + Prisma client
│   │   ├── modules/
│   │   │   ├── users/         # controller · service · repository · routes · schema
│   │   │   ├── cards/
│   │   │   └── payments/
│   │   ├── plugins/           # swagger · errorHandler
│   │   ├── shared/
│   │   │   ├── errors/        # AppError
│   │   │   └── http/          # Python HTTP client
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── payment-processor-python/  # Python payment microservice (stdlib only)
│   ├── src/
│   │   ├── config/env.py
│   │   ├── handlers/payment_handler.py
│   │   ├── services/payment_service.py
│   │   ├── utils/
│   │   │   ├── json_response.py
│   │   │   └── logger.py
│   │   └── server.py          # Entry point (ThreadingTCPServer)
│   ├── tests/                 # 51 unit tests (pytest)
│   ├── scripts/
│   │   ├── setup_env.sh       # Virtual environment setup
│   │   └── run_tests.sh       # Test runner
│   ├── Dockerfile
│   ├── requirements-dev.txt   # pytest, pytest-cov
│   ├── .python-version        # asdf version pinning
│   ├── ASDF.md                # asdf user guide
│   └── tests/README.md        # Testing documentation
│
├── postman/
│   └── payment-system.postman_collection.json
│
├── docker-compose.yml
└── README.md
```

---

## Quick Start — Docker Compose (recommended)

> **Prerequisites:** Docker ≥ 24 and Docker Compose v2

```bash
# 1. Clone the repository
git clone <repo-url>
cd payment-system-technical-test

# 2. Start all services (Postgres + Python processor + Node API)
docker compose up --build

# Services:
#   API Gateway  → http://localhost:3000
#   Swagger UI   → http://localhost:3000/docs
#   Python proc  → http://localhost:5000
#   PostgreSQL   → localhost:5432
```

The Node.js API runs `prisma db push` on startup, so tables are created automatically.

---

## Manual Setup (without Docker)

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Python ≥ 3.12
- PostgreSQL ≥ 14 (running locally)

---

### 1 — PostgreSQL

Ensure PostgreSQL 16 is running. Docker Compose handles this automatically,
or start it manually:

```bash
# macOS (Homebrew)
brew services start postgresql@16

# Ubuntu/Debian
sudo systemctl start postgresql

# Or use Docker
docker run -d \
  -e POSTGRES_PASSWORD=payment_pass \
  -e POSTGRES_USER=payment_user \
  -e POSTGRES_DB=payment_db \
  -p 5432:5432 \
  postgres:16-alpine
```

---

### 2 — Python Payment Processor

```bash
cd payment-processor-python

# Copy and (optionally) edit the env file
cp .env.example .env

# Setup virtual environment (auto-detects asdf or system Python)
./scripts/setup_env.sh

# Or manually
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate.bat  # Windows

# Install dev dependencies (only for testing)
pip install -r requirements-dev.txt

# Run the payment service
python src/server.py
# Listening on http://0.0.0.0:5000

# Run tests (51 unit tests)
./scripts/run_tests.sh
```

---

### 3 — Node.js API Gateway

```bash
cd api-gateway-node

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres connection string

# Create database schema (Prisma)
npm run db:push

# Insert demo seed data
npm run db:seed

# Start in development mode (hot reload)
npm run dev
# API ready at http://localhost:3000
# Swagger UI at http://localhost:3000/docs
```

---

## API Endpoints

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/health`                     | Liveness check                  |
| POST   | `/api/v1/users`               | Create a user                   |
| GET    | `/api/v1/users`               | List all users                  |
| GET    | `/api/v1/users/:id`           | Get a user by ID                |
| POST   | `/api/v1/cards`               | Register a card                 |
| GET    | `/api/v1/cards?userId=:id`    | List a user's cards             |
| GET    | `/api/v1/cards/:id`           | Get a card by ID                |
| POST   | `/api/v1/payments`            | Create a payment                |
| GET    | `/api/v1/payments?userId=:id` | List a user's payment history   |

Full interactive documentation is available at **`/docs`** (Swagger UI).

---

## Postman Collection

Import `postman/payment-system.postman_collection.json` into Postman.

The collection includes automatic test scripts:
- **Create User** saves `userId` to a collection variable.
- **Register Card** saves `cardId` to a collection variable.
- Subsequent requests use `{{userId}}` and `{{cardId}}` automatically.

**Recommended flow:**

```
1. Health Check
2. Create User        ← sets {{userId}}
3. Register Card      ← sets {{cardId}}
4. Create Payment     ← run several times to observe 80/20 distribution
5. List Payment History
```

---

## Environment Variables

### Node.js API (`api-gateway-node/.env`)

| Variable             | Default                 | Description                  |
|----------------------|-------------------------|------------------------------|
| `NODE_ENV`           | `development`           | `development` \| `production`|
| `PORT`               | `3000`                  | HTTP port                    |
| `HOST`               | `0.0.0.0`               | Bind address                 |
| `DATABASE_URL`       | *(required)*            | PostgreSQL connection string |
| `PYTHON_SERVICE_URL` | `http://localhost:5000` | Python processor base URL    |
| `LOG_LEVEL`          | `info`                  | Pino log level               |

### Python Processor (`payment-processor-python/.env`)

| Variable                  | Default    | Description                    |
|---------------------------|------------|--------------------------------|
| `PAYMENT_PROCESSOR_HOST`  | `0.0.0.0`  | Bind address                   |
| `PAYMENT_PROCESSOR_PORT`  | `5000`     | HTTP port                      |
| `LOG_LEVEL`               | `INFO`     | Python logging level           |
| `APPROVAL_RATE`           | `0.8`      | Approval probability (0.0–1.0) |

---

## Enhanced Security & Audit Features

### PaymentStatus Enum
- Strict type safety: `PENDING` | `APPROVED` | `REJECTED` | `FAILED`
- Enforced at database level (PostgreSQL enum type)
- Prevents invalid state values

### Multi-Currency Support
- ISO 4217 standard (USD, EUR, COP, etc.)
- Default: USD
- Track exact currency with each transaction

### Audit Trail
- `createdAt` — timestamp when record created
- `updatedAt` — timestamp of last modification
- Automatic timestamps via Prisma `@updatedAt`
- Enables compliance reporting

### Referential Integrity
- `onDelete: Restrict` prevents deletion of users/cards with payments
- Protects transaction history from accidental removal
- Ensures financial audit trails remain intact

### Performance Indexes
Strategic indexes for fast queries:
- `(userId, createdAt)` — user payment history
- `transactionId` — duplicate prevention (idempotency)
- `status` — payment status reporting
- `email` — user lookup during authentication

### Financial Precision
- `Decimal(12, 2)` storage (up to 9,999,999.99)
- Supports high-inflation currencies
- Node.js: Always use `Decimal.js` for monetary values (never raw floats)

---

## Best Practices Demonstrated

| Practice | Implementation |
|---|---|
| Clean Architecture | Controller → Service → Repository → Database |
| Input Validation | TypeBox JSON Schema (Fastify built-in) |
| Centralised Error Handling | `AppError` + Fastify `setErrorHandler` |
| Security Headers | `@fastify/helmet` |
| PCI-DSS Principle | Only `last4` + opaque `fakeToken` stored — never the full card number |
| Structured Logging | Pino (JSON in prod, pretty-printed in dev) |
| Service Isolation | Python processor runs independently; Node API calls it over HTTP |
| Concurrency Safety | Python uses `ThreadingTCPServer` to handle parallel requests |
| Environment Config | All secrets in `.env`, validated at startup |
| UUID Primary Keys | More secure than sequential integer IDs |
| Audit Trail | Every payment logged with createdAt + updatedAt timestamps |
| API Documentation | OpenAPI 3.0 via Swagger UI |
| **Type Safety (Enums)** | **PaymentStatus enforced at DB level (PostgreSQL enum)** |
| **Multi-Currency** | **ISO 4217 standard; track exact currency per transaction** |
| **Referential Integrity** | **`onDelete: Restrict` protects transaction history** |
| **Financial Precision** | **Decimal(12, 2) with Decimal.js in code** |
| **Performance Indexes** | **Strategic DB indexes for fast queries** |

---

## Testing

### Payment Processor (Python) — Unit Tests

The Python payment service includes **51 comprehensive unit tests** covering:
- **Config loading** — environment variables, defaults, validation
- **Payment logic** — approval/decline rates, invalid amounts, edge cases
- **HTTP handling** — JSON parsing, error responses, UTF-8 validation
- **Utilities** — logging, JSON response formatting

#### Setup with Virtual Environment (Recommended)

**For asdf users** — the setup script automatically detects asdf Python:

```bash
cd payment-processor-python

# Just run the setup script — it works with asdf!
./scripts/setup_env.sh

# Virtual environment is now active
```

See [payment-processor-python/ASDF.md](payment-processor-python/ASDF.md) for detailed asdf workflows and troubleshooting.

**For all users** (automated):

```bash
cd payment-processor-python

# Automated setup: creates venv and installs dependencies
./scripts/setup_env.sh

# Virtual environment is now active (you should see (.venv) in your prompt)
```

Or manually:

```bash
cd payment-processor-python

# Create virtual environment
python -m venv .venv

# Activate
source .venv/bin/activate  # Linux / macOS (works with asdf or system Python)
# OR
.venv\Scripts\activate.bat  # Windows cmd
# OR  
.venv\Scripts\Activate.ps1  # Windows PowerShell

# Install dependencies
pip install -r requirements-dev.txt
```

#### Running Tests

```bash
# Make sure virtual environment is active
# Run test suite
./scripts/run_tests.sh

# Or use pytest directly
pytest tests/ -v
```

#### More Test Options

```bash
# Assuming virtual environment is activated

# Run tests and fail on first failure (fast mode)
./scripts/run_tests.sh --fast

# Run specific test by name
./scripts/run_tests.sh -k test_process_negative_amount_rejected

# Run tests in a specific file
pytest tests/test_payment_service.py -v

# Deactivate virtual environment when done
deactivate
```

#### Test Files

- [tests/test_config.py](payment-processor-python/tests/test_config.py) — 12 config tests
- [tests/test_payment_service.py](payment-processor-python/tests/test_payment_service.py) — 13 service tests
- [tests/test_utils.py](payment-processor-python/tests/test_utils.py) — 13 utility tests
- [tests/test_payment_handler.py](payment-processor-python/tests/test_payment_handler.py) — 13 handler tests

See [payment-processor-python/tests/README.md](payment-processor-python/tests/README.md) for detailed test coverage.

### Node.js API Gateway — Unit Tests

The Node.js API Gateway includes **29 unit tests** with **100% coverage** of core business logic:

#### Test Suite Overview

| Module | Tests | Coverage | Files Tested |
|--------|-------|----------|--------------|
| **UsersService** | 6 | 100% | User creation, retrieval, listing, validation |
| **CardsService** | 7 | 100% | Card registration, ownership validation, card listing |
| **PaymentsService** | 10 | 100% | Payment creation, status handling, multi-currency, processor integration |
| **AppError** | 6 | 100% | Error handling, status codes, error propagation |
| **Total** | **29** | **100%** | Service layer business logic |

#### Running Tests

```bash
cd api-gateway-node

# Run all tests once
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Test Output Example

```bash
$ npm run test

 ✓ src/shared/errors/AppError.test.ts (6)
 ✓ src/modules/users/users.service.test.ts (6)
 ✓ src/modules/cards/cards.service.test.ts (7)
 ✓ src/modules/payments/payments.service.test.ts (10)

 Test Files  4 passed (4)
      Tests  29 passed (29)
   Duration  745ms
```

#### Test Files & What They Cover

| File | Purpose | Key Tests |
|------|---------|-----------|
| [users.service.test.ts](api-gateway-node/src/modules/users/users.service.test.ts) | User management | Email uniqueness, user lookup, listing |
| [cards.service.test.ts](api-gateway-node/src/modules/cards/cards.service.test.ts) | Card handling | Card registration, ownership validation, filtering |
| [payments.service.test.ts](api-gateway-node/src/modules/payments/payments.service.test.ts) | Payment processing | Approved/rejected payments, multi-currency, processor errors, audit trail |
| [AppError.test.ts](api-gateway-node/src/shared/errors/AppError.test.ts) | Error handling | Custom error class, status codes, error propagation |

#### Key Test Scenarios

**UsersService:**
- ✅ Create user with unique email
- ✅ Prevent duplicate email addresses
- ✅ Retrieve user by ID
- ✅ Handle non-existent users
- ✅ List all users
- ✅ Return empty array when no users exist

**CardsService:**
- ✅ Register card for existing user
- ✅ Validate user exists before registration
- ✅ Retrieve card by ID
- ✅ List cards for a user
- ✅ Enforce card ownership
- ✅ Handle non-existent cards

**PaymentsService:**
- ✅ Process approved payments
- ✅ Persist rejected payments for audit
- ✅ Validate card ownership
- ✅ Support multi-currency (USD, EUR, COP, etc.)
- ✅ Default to USD when currency not specified
- ✅ Handle processor service failures
- ✅ List payment history by user

**AppError:**
- ✅ Create errors with custom status and code
- ✅ Maintain error inheritance chain
- ✅ Support throw/catch patterns
- ✅ Work with error handlers

#### Coverage Report

```bash
$ npm run test:coverage

% Coverage report from v8
File              | % Stmts | % Branch | % Funcs | % Lines
-----------------|---------|----------|---------|----------
AppError.ts       |  100    |  100     |  100    |  100
cards.service.ts  |  100    |  100     |  100    |  100
payments.service.ts | 100   |  100     |  100    |  100
users.service.ts  |  100    |  100     |  100    |  100
```

#### Using Vitest Configuration

Tests use **Vitest** (fast unit test runner for TypeScript/Node.js):

- **Config:** [vitest.config.ts](api-gateway-node/vitest.config.ts)
- **Environment:** [.env.test](api-gateway-node/.env.test)
- **Reporters:** Verbose output with stack traces
- **Coverage:** v8 provider with HTML/JSON output

For advanced Vitest features, see [vitest.dev](https://vitest.dev/):

```bash
# Watch mode (re-run tests on file changes)
npm run test:watch

# Generate HTML coverage report (opens in browser)
npm run test:coverage
# View report at: coverage/index.html
```


### API Gateway (Node.js) — Type Checking

```bash
cd api-gateway-node

# Full type check (no emit)
npm run type-check

# Build (includes type check)
npm run build
```

---

## Development Commands

### 🚀 Start/Stop Services

```bash
# Start all services in background (recommended)
docker compose up --build -d

# View logs
docker compose logs -f api-gateway      # API Gateway
docker compose logs -f payment-processor # Python Service
docker compose logs -f postgres          # Database

# Stop and clean all services
docker compose down                      # Keep data
docker compose down -v                   # Delete all data

# Restart specific service
docker compose restart api-gateway
```

### 📝 Node.js API Gateway (`cd api-gateway-node/`)

#### Development
```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run type-check   # Check types without building
npm run build        # Compile TypeScript → dist/

# Linting (if configured)
npm run lint
```

#### Database Management
```bash
# Sync Prisma schema with database
npm run db:push              # Apply schema changes
npm run db:push --force-reset # Reset database (DANGER: deletes data)

# Insert demo seed data
npm run db:seed

# Open Prisma Studio (GUI for database)
npm run db:studio

# View migration status
npx prisma migrate status
```

#### Type Generation
```bash
# Regenerate Prisma Client (after schema changes)
npx prisma generate

# Also runs on: npm install, npm run db:push
```

### 🐍 Python Payment Processor (`cd payment-processor-python/`)

#### Development
```bash
# Start payment processor (requires Python 3.12+)
python3 src/server.py

# With asdf (auto-detects correct Python version)
python src/server.py
```

#### Virtual Environment Setup
```bash
# Automated setup (recommended)
./scripts/setup_env.sh

# Manual setup
python -m venv .venv
source .venv/bin/activate      # Linux/macOS
# OR
.venv\Scripts\activate.bat     # Windows

# Install dependencies
pip install -r requirements-dev.txt
```

#### Testing
```bash
# Run all tests
./scripts/run_tests.sh

# Run specific test
./scripts/run_tests.sh -k test_process_payment_approved

# Fast mode (stop at first failure)
./scripts/run_tests.sh --fast

# With coverage report
./scripts/run_tests.sh --cov

# Deactivate virtual environment
deactivate
```

### 🧪 API Testing (curl/Postman)

#### Basic Health Checks
```bash
# API Gateway health
curl http://localhost:3000/health | jq

# Payment Processor health
curl http://localhost:5000/health | jq

# Both services running?
docker compose ps
```

#### Create User
```bash
USER=$(curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }' | jq -r '.id')

echo "Created user: $USER"
```

#### List Users
```bash
curl -s http://localhost:3000/api/v1/users | jq
```

#### Register Card
```bash
USER_ID="<paste-user-id>"
CARD=$(curl -s -X POST http://localhost:3000/api/v1/cards \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"holderName\": \"Alice Johnson\",
    \"last4\": \"4242\",
    \"brand\": \"Visa\",
    \"fakeToken\": \"tok_visa_$(date +%s)\",
    \"expiresAt\": \"2027-12-31T23:59:59Z\"
  }" | jq -r '.id')

echo "Created card: $CARD"
```

#### Process Payment (USD)
```bash
USER_ID="<paste-user-id>"
CARD_ID="<paste-card-id>"

PAYMENT=$(curl -s -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"cardId\": \"$CARD_ID\",
    \"amount\": 99.99,
    \"currency\": \"USD\"
  }")

echo "$PAYMENT" | jq '{id, amount, currency, status, transactionId}'
```

#### Process Payment (Alternative Currency)
```bash
# EUR or COP or any ISO 4217 code
curl -s -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"cardId\": \"$CARD_ID\",
    \"amount\": 50.00,
    \"currency\": \"EUR\"
  }" | jq
```

#### Get Payment History
```bash
USER_ID="<paste-user-id>"

curl -s "http://localhost:3000/api/v1/payments?userId=$USER_ID" | jq '.[] | {id, amount, currency, status, createdAt, updatedAt}'
```

#### Get User Cards
```bash
USER_ID="<paste-user-id>"

curl -s "http://localhost:3000/api/v1/cards?userId=$USER_ID" | jq
```

### 📊 Monitoring & Debugging

#### View API Logs
```bash
# Real-time logs (follow mode)
docker compose logs -f api-gateway

# Last 50 lines
docker compose logs api-gateway | tail -50

# Search for errors
docker compose logs api-gateway | grep -i error
```

#### Database Inspection
```bash
# Open Prisma Studio
cd api-gateway-node && npm run db:studio

# Or connect directly with psql
psql -h localhost -U payment_user -d payment_db -c "SELECT * FROM payments LIMIT 5;"
```

#### Performance Monitoring
```bash
# Watch Docker resource usage
docker stats

# Check API response times
time curl http://localhost:3000/api/v1/users
```

### 🔄 Common Development Workflows

#### Full Reset (Start Fresh)
```bash
# 1. Stop all services
docker compose down -v

# 2. Rebuild and start
docker compose up --build

# 3. Verify services are healthy
docker compose ps
```

#### Update Database Schema
```bash
# 1. Edit: api-gateway-node/prisma/schema.prisma
# 2. Apply changes
cd api-gateway-node
npm run db:push

# 3. Regenerate types
npx prisma generate

# 4. Rebuild API
npm run build
```

#### Run Python Tests in Container
```bash
docker compose exec payment-processor bash -c "cd /app && ./scripts/run_tests.sh"
```

#### Seed Database with Demo Data
```bash
cd api-gateway-node
npm run db:seed
```

#### View Database Schema
```bash
cd api-gateway-node
npm run db:studio
```

---

## Stopping Docker Services

```bash
docker compose down        # stop containers
docker compose down -v     # stop and remove volumes (resets DB)
```
