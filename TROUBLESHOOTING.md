
# Troubleshooting Guide

Quick solutions for common runtime errors and common issues.

---

**Looking for setup or onboarding help?**

👉 **See [GETTING_STARTED.md](GETTING_STARTED.md) for all setup and onboarding instructions.**

---

## Runtime Issues

### ❌ `TypeError: Cannot read property 'email' of undefined`

**Error Location:** User creation endpoint: `POST /users`

**Root Cause:** Request body validation failed (missing `email` or `name` field).

**Solution:**

```bash
# Check your request body
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'

# Verify request matches schema
# Required fields: email (string), name (string)
```

---

### ❌ `CARD_OWNERSHIP_ERROR (403)`

**Error Location:** Payment or card endpoints

**Root Cause:** Trying to access a card that doesn't belong to the authenticated user.

**Solution:**

```bash
# 1. Get your user ID
GET /users/{userId}

# 2. List YOUR cards only
GET /cards?userId={YOUR_USER_ID}

# 3. Use card that belongs to YOU
POST /payments
{
  "userId": "YOUR_USER_ID",
  "cardId": "CARD_OWNED_BY_YOU"
}
```

---

### ❌ `USER_NOT_FOUND (404)`

**Error Location:** Any endpoint with `:userId` parameter

**Root Cause:** User ID doesn't exist in database.

**Solution:**

```bash
# 1. List all users
GET /users

# 2. Use correct user ID from list
# 3. Or create a new user first
POST /users
{
  "email": "newuser@example.com",
  "name": "New User"
}
```

---

### ❌ `PAYMENT_PROCESSOR_UNAVAILABLE (502)`

**Error Location:** Payment creation: `POST /payments`

**Root Cause:** Python payment processor service not running or not responding.

**Solution:**

```bash
# 1. Verify Python processor is running
curl http://localhost:5000/health  # Should return 200

# 2. If not running, start it
cd payment-processor-python
source .venv/bin/activate
python src/server.py

# 3. If using Docker, check container status
docker ps  # Should show payment-processor-python running

# 4. If still failing, check logs
docker compose logs payment-processor-python
```

---

### ❌ `Hydration mismatch` (Next.js only)

**Error Location:** Browser console (if using Next.js frontend)

**Root Cause:** SSR HTML doesn't match client-side render.

**Solution:**

```javascript
// Ensure async data fetching happens server-side only
// ✓ CORRECT: Fetched during getServerSideProps / getStaticProps
export async function getServerSideProps() {
  const payments = await fetch('/api/payments')
  return { props: { payments } }
}

// ✗ WRONG: Fetched in useEffect will mismatch SSR
useEffect(() => {
  fetch('/api/payments').then(setPayments)
}, [])
```

---

## Docker Issues

### ❌ `docker: command not found`

**Root Cause:** Docker not installed.

**Solution:**

```bash
# macOS
brew install docker docker-compose

# Ubuntu/Debian
sudo apt-get install docker.io docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

### ❌ `docker compose up` fails with permission denied

**Root Cause:** User doesn't have permission to run Docker.

**Solution:**

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Verify (should work without sudo)
docker ps

# If still failing, use sudo
sudo docker compose up
```

---

### ❌ Container exits immediately

**Error Location:** `docker compose logs <service>`

**Solution:**

```bash
# Check logs for actual error
docker compose logs -f api-gateway

# Common causes:
# - Database connection failed → verify DATABASE_URL
# - Port already in use → kill process or change PORT
# - Dependencies not installed → rebuild image
docker compose up --build --force-recreate
```

---

## Testing Issues

### ❌ `Tests timeout` (Node.js)

**Error Location:** `npm run test` hangs

**Root Cause:** Database query or external service call is slow.

**Solution:**

```bash
# Set higher timeout
npm run test -- --reporter=verbose

# Or increase timeout in vitest.config.ts
export default {
  test: {
    testTimeout: 10000  // 10 seconds
  }
}
```

---

### ❌ Python tests fail with `fixtures not found`

**Error Location:** `pytest` execution

**Root Cause:** Test discovery issue or incorrect working directory.

**Solution:**

```bash
# Ensure you're in payment-processor-python/
cd payment-processor-python

# Verify pytest finds tests
pytest --collect-only

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_payment_service.py -v
```

---

## Getting Help

1. **Check this guide** — Most common issues are listed above
2. **Check logs** — Run with verbose/debug flags:
   - Node: `npm run dev -- --debug`
   - Python: `LOG_LEVEL=debug python src/server.py`
   - Docker: `docker compose logs -f --tail=100`
3. **Check GitHub Issues** — Similar problems may have solutions
4. **Verify environment** — Run `npm run doctor` (if implemented) or manual checks:
```bash
   node --version     # Should be v20+
   npm --version      # Should be v10+
   python --version   # Should be v3.12+
   docker --version   # Should be v24+
   ```

---

## Report a New Issue

If your problem isn't listed:

1. Collect information:
```bash
   node --version && npm --version && python --version && docker --version
   uname -a  # OS info
   npm list  # Installed packages
   ```

2. Create clear reproduction steps
3. Include full error message (screenshot or text)
4. Open GitHub issue with all details
*** End Patch

