# Getting Started — Step-by-Step

This guide walks you through setting up the payment system for the first time.

> Note: This system has been tested only on Pop!_OS 22.04 LTS.

---

## ⏱️ Time Required

- **Docker setup:** 5–10 minutes (recommended)
- **Local setup:** 10–15 minutes
- **Full developer setup:** 15–20 minutes

---

## Option 1: Docker Setup (Recommended ⭐)

**Best for:** Testing, learning, quick demos

### Step 1: Prerequisites

- Docker Desktop installed ([download](https://www.docker.com/products/docker-desktop))
- Git installed

### Step 2: Clone Repository

```bash
git clone https://github.com/your-org/payment-system-technical-test.git
cd payment-system-technical-test
```

### Step 3: Start All Services

```bash
docker compose up --build
```

This will:
- Create PostgreSQL database
- Build Node.js API image
- Build Python processor image
- Start all services

**Wait for this output:**
```
payment-processor-python | Server listening on http://0.0.0.0:5000
api-gateway | Server running at http://0.0.0.0:3000
```

### Step 4: Verify Setup

Open a **new terminal** and test:

```bash
# Check API health
curl http://localhost:3000/health

# Should return:
# {"status":"ok"}
```

#### (Recommended) Run Automated Setup Verification

After completing the setup steps above, you can run the automated verification script to check your environment and configuration:

```bash
bash scripts/verify_setup.sh
```

This script will check system requirements, project structure, service status, and common configuration issues. Review the output for any errors or warnings and follow the suggested next steps if needed.

### Step 5: Test with Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Open `postman/payment-system.postman_collection.json` in Postman
3. Run any request (e.g., **Create User**)

**Services Ready:**
- API: http://localhost:3000
- Swagger UI: http://localhost:3000/docs
- Python Processor: http://localhost:5000
- Database: localhost:5432

---

## Option 2: Local Setup (For Development)

**Best for:** Active development, debugging

### Prerequisites

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node postgresql@16 python@3.12
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql postgresql-contrib python3 python3-pip
sudo systemctl start postgresql
```

**Windows (using WSL recommended):**
- Install [WSL2](https://docs.microsoft.com/windows/wsl/install)
- Then follow Ubuntu/Debian steps above

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/payment-system-technical-test.git
cd payment-system-technical-test
```

### Step 2: Start PostgreSQL

If not already running:

```bash
# macOS
brew services start postgresql@16

# Ubuntu/Debian
sudo systemctl start postgresql

# Verify
psql --version
```

### Step 3: Setup Node.js API Gateway

```bash
cd api-gateway-node

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run database migrations
npx prisma db push

# Start dev server
npm run dev
```

**Output should show:**
```
Server running at http://0.0.0.0:3000
```

### Step 4: Setup Python Payment Processor

In a **new terminal**:

```bash
cd payment-processor-python

# Run automatic setup
./scripts/init-dev.sh

# This will:
# - Install system dependencies (python3-venv)
# - Create virtual environment
# - Install Python packages

# Activate venv
source .venv/bin/activate

# Start server
python src/server.py
```

**Output should show:**
```
Server listening on http://0.0.0.0:5000
```

### Step 5: Test the Setup

In a **third terminal**:

```bash
# Test API
curl http://localhost:3000/health

# List users
curl http://localhost:3000/users

# Run tests
cd api-gateway-node
npm run test

cd ../payment-processor-python
./scripts/run_tests.sh
```

---

## Option 3: Full Developer Setup

**Best for:** Active development on both Node.js and Python

Combine steps from **Option 2**, then:

### Setup IDE Extensions

**VS Code:**
- Install "Python" extension (Microsoft)
- Install "Prettier" extension
- Install "ESLint" extension
- Settings:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
  ```

**PyCharm:**
- Open `payment-processor-python/` as project
- Create Python interpreter from `.venv/`
- Enable pytest integration

### Watch Mode Development

**Terminal 1 — Node.js (auto-reload on changes):**
```bash
cd api-gateway-node
npm run dev -- --watch
```

**Terminal 2 — Python (auto-reload on changes):**
```bash
cd payment-processor-python
source .venv/bin/activate
python -m watchdog.auto_reload src/server.py
```

**Terminal 3 — Tests (run on save):**
```bash
cd api-gateway-node
npm run test:watch
```

---

## Common Issues During Setup

### ❌ Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### ❌ venv Module Not Found

```
bash: .venv/bin/activate: No such file or directory
```

**Solution:**
```bash
cd payment-processor-python
./scripts/init-dev.sh  # Auto-installs python3-venv
```

### ❌ PostgreSQL Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Start PostgreSQL
# macOS
brew services start postgresql@16

# Ubuntu/Debian
sudo systemctl start postgresql

# Or use Docker
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=payment_pass \
  -e POSTGRES_USER=payment_user \
  postgres:16-alpine
```

### ❌ npm install Fails

```
npm ERR! code ERESOLVE
```

**Solution:**
```bash
npm install --legacy-peer-deps
```

**More issues?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Next Steps

### Learn the API

1. **Swagger UI:** http://localhost:3000/docs (interactive API docs)
2. **Postman:** Import `postman/payment-system.postman_collection.json`
3. **cURL examples:**
   ```bash
   # Create user
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "name": "John Doe"
     }'
   ```

### Run Tests

```bash
# Node.js tests
cd api-gateway-node
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Python tests
cd payment-processor-python
./scripts/run_tests.sh
```

### Explore the Code

1. **API Gateway:** `api-gateway-node/src/modules/`
   - `users/` — User management
   - `cards/` — Card registration
   - `payments/` — Payment processing

2. **Payment Processor:** `payment-processor-python/src/`
   - `handlers/` — HTTP request handling
   - `services/` — Business logic
   - `utils/` — Helpers

### Make Your First Change

**Node.js example:**
```typescript
// api-gateway-node/src/modules/users/users.controller.ts
// Add a new endpoint or modify existing logic
```

**Python example:**
```python
# payment-processor-python/src/services/payment_service.py
# Modify payment processing logic
```

Then run tests to verify:
```bash
npm run test              # Node.js
./scripts/run_tests.sh    # Python
```

---

## Helpful Commands

```bash
# Start/Stop Docker services
docker compose up              # Start all services
docker compose down            # Stop all services
docker compose logs -f         # View logs

# Node.js
npm run dev                    # Start dev server
npm run test                   # Run tests
npm run lint                   # Check code style
npm run type-check             # TypeScript validation
npm run build                  # Production build

# Python
python src/server.py           # Start server
./scripts/run_tests.sh         # Run tests
source .venv/bin/activate      # Activate venv
deactivate                     # Deactivate venv

# Database
psql -U payment_user -d payment_db  # Connect to database
\dt                            # List tables
\q                             # Exit psql
```

---

## Performance Checks

Verify everything is working optimally:

```bash
# Check API response time
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/health

# Check database connection
# Should be < 100ms for local connection

# Monitor CPU/Memory (Docker)
docker stats
```

---

## What's Next?

- **Want to contribute?** → Read [CONTRIBUTING.md](CONTRIBUTING.md)
- **Need help?** → Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **API documentation:** → Visit http://localhost:3000/docs
- **Code examples:** → See `postman/` directory

---

## Support

If you get stuck:

1. **Check logs:** `docker compose logs` or terminal output
2. **Check TROUBLESHOOTING.md** for your error
3. **Search GitHub Issues** for similar problems
4. **Create a new issue** with:
   - Error message (full stack trace)
   - Your OS (macOS / Ubuntu / Windows)
   - Software versions (`node -v`, `python --version`, `docker --version`)
   - Steps to reproduce

---

**Welcome to the team! 🚀**

