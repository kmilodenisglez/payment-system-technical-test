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
| Audit Trail | Every payment (approved or rejected) is persisted |
| API Documentation | OpenAPI 3.0 via Swagger UI |

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

```bash
# Node.js (run from api-gateway-node/)
npm run dev          # start with hot reload
npm run build        # compile TypeScript → dist/
npm run type-check   # validate types without emitting
npm run lint         # ESLint
npm run db:push      # sync Prisma schema → DB
npm run db:seed      # insert demo data
npm run db:studio    # open Prisma Studio (DB browser)

# Python (run from payment-processor-python/)
python3 src/server.py

# Testing
cd payment-processor-python && ./scripts/run_tests.sh  # run all tests
```

---

## Stopping Docker Services

```bash
docker compose down        # stop containers
docker compose down -v     # stop and remove volumes (resets DB)
```
