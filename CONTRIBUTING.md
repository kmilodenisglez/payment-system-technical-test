# Contributing Guide

Welcome! This guide explains how to contribute code, follow standards, and submit pull requests.

---

**Looking to set up the project or onboard as a new developer?**

👉 **See [GETTING_STARTED.md](GETTING_STARTED.md) for all setup and onboarding instructions.**

---

## Contributing Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number
```

### 2. Make Your Changes

**For Node.js changes:**

```bash
cd api-gateway-node
npm run test -- --watch      # Run tests in watch mode
npm run lint                  # Check code style
npm run type-check            # Verify TypeScript
npm run dev                   # Start dev server
```

**For Python changes:**

```bash
cd payment-processor-python
source .venv/bin/activate
./scripts/run_tests.sh        # Run tests
python src/server.py          # Start server
```

### 3. Follow Code Standards

#### TypeScript (Node.js)

```typescript
// ✓ GOOD: Clear naming, typed functions
export async function createUser(
  email: string,
  name: string
): Promise<User> {
  return await usersRepository.create({ email, name })
}

// ✗ BAD: Any types, unclear naming
export async function cu(u: any): Promise<any> {
  return await repo.c(u)
}
```

#### Python

```python
# ✓ GOOD: Docstrings, type hints
def process_payment(amount: float, currency: str = "USD") -> PaymentResult:
    """Process payment and return result."""
    if not is_valid_amount(amount):
        raise ValidationError("Invalid amount")
    return PaymentResult(status="approved", amount=amount)

# ✗ BAD: No documentation, missing types
def process_payment(amount, currency):
    return {"status": "ok", "amount": amount}
```

### 4. Write Tests

#### Node.js (Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PaymentsService } from './payments.service'

describe('PaymentsService', () => {
  let service: PaymentsService

  beforeEach(() => {
    service = new PaymentsService(mockRepository)
  })

  it('should create approved payment', async () => {
    const payment = await service.createPayment({
      userId: '123',
      cardId: 'card-456',
      amount: 100,
      currency: 'USD'
    })

    expect(payment.status).toBe('APPROVED')
    expect(payment.amount).toBe(100)
  })
})
```

#### Python (pytest)

```python
import pytest
from src.services.payment_service import PaymentService

class TestPaymentService:
    @pytest.fixture
    def service(self):
        return PaymentService()

    def test_process_payment_approved(self, service):
        result = service.process_payment(
            amount=100.0,
            currency="USD"
        )
        
        assert result.status == "approved"
        assert result.amount == 100.0
```

### 5. Run All Checks

```bash
# Node.js
cd api-gateway-node
npm run lint
npm run type-check
npm run test

# Python
cd payment-processor-python
source .venv/bin/activate
./scripts/run_tests.sh
```

### 6. Commit and Push

```bash
git add .
git commit -m "feat: add payment status filtering"
git push origin feature/your-feature-name
```


Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring (no behavior change)
- `test:` Adding or updating tests
- `docs:` Documentation
- `chore:` Dependencies, tooling

### 7. Create Pull Request

1. Go to GitHub
2. Create PR from your branch → `main`
3. Add description of changes
4. Link related issues (e.g., "Closes #123")
5. Ensure checks pass (tests, linting, types)

---

## Project Structure

payment-system-technical-test/
│
├── api-gateway-node/              # REST API (Fastify + TypeScript)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── users/             # User management
│   │   │   ├── cards/             # Card registration
│   │   │   └── payments/          # Payment processing
│   │   ├── plugins/               # Fastify plugins
│   │   └── shared/
│   │       ├── errors/            # Error handling
│   │       └── http/              # HTTP client
│   ├── tests/                     # Unit tests
│   ├── prisma/                    # Database schema
│   └── package.json
│
├── payment-processor-python/      # Payment Processor (Python)
│   ├── src/
│   │   ├── handlers/              # HTTP handlers
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # Helpers
│   │   └── config/                # Configuration
│   ├── tests/                     # Unit tests (51 tests)
│   ├── scripts/
│   │   ├── init-dev.sh            # Initial setup
│   │   ├── setup_env.sh           # Environment setup
│   │   └── run_tests.sh           # Test runner
│   └── requirements-dev.txt
│
├── postman/                       # API Collection
├── docker-compose.yml             # Multi-container setup
├── README.md                      # Main documentation
├── TROUBLESHOOTING.md            # Common issues
└── CONTRIBUTING.md               # This file

```text
payment-system-technical-test/
│
├── api-gateway-node/              # REST API (Fastify + TypeScript)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── users/             # User management
│   │   │   ├── cards/             # Card registration
│   │   │   └── payments/          # Payment processing
│   │   ├── plugins/               # Fastify plugins
│   │   └── shared/
│   │       ├── errors/            # Error handling
│   │       └── http/              # HTTP client
│   ├── tests/                     # Unit tests
│   ├── prisma/                    # Database schema
│   └── package.json
│
├── payment-processor-python/      # Payment Processor (Python)
│   ├── src/
│   │   ├── handlers/              # HTTP handlers
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # Helpers
│   │   └── config/                # Configuration
│   ├── tests/                     # Unit tests (51 tests)
│   ├── scripts/
│   │   ├── init-dev.sh            # Initial setup
│   │   ├── setup_env.sh           # Environment setup
│   │   └── run_tests.sh           # Test runner
│   └── requirements-dev.txt
│
├── postman/                       # API Collection
├── docker-compose.yml             # Multi-container setup
├── README.md                      # Main documentation
├── TROUBLESHOOTING.md            # Common issues
└── CONTRIBUTING.md               # This file
```

---

## Architecture Overview

### API Flow

```
Client Request
    ↓
[Node.js API Gateway]
    ├── Validates input (TypeBox)
    ├── Checks permissions
    ├── Calls service layer
    └── Returns JSON response
    ↓
[Service Layer]
    ├── PaymentsService
    ├── UsersService
    ├── CardsService
    └── Calls HTTP client
    ↓
[Python Payment Processor]
    ├── Processes payment
    ├── Returns APPROVED/REJECTED
    └── Sends response back
    ↓
[PostgreSQL Database]
    ├── Stores users
    ├── Stores cards
    ├── Stores payments (audit trail)
    └── Maintains referential integrity
```

### Key Design Patterns

1. **Service Layer Pattern** — Business logic separated from HTTP layer
2. **Repository Pattern** — Data access abstraction
3. **Dependency Injection** — Services receive dependencies
4. **Error Handling** — Consistent `AppError` class
5. **Type Safety** — TypeScript + Prisma for Node, Type hints for Python

---

## Testing Best Practices

### Node.js (Vitest)

- Unit test each service independently
- Mock external dependencies (HTTP client, database)
- Aim for 100% coverage on core logic
- Use `vi.fn()` for spies and mocks
- Run: `npm run test`

### Python (pytest)

- Test payment processing logic thoroughly
- Mock HTTP responses
- Verify edge cases (invalid amounts, currencies)
- Test error handling
- Run: `./scripts/run_tests.sh`

### Commands

```bash
# Node.js
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Python
./scripts/run_tests.sh              # Run all tests
./scripts/run_tests.sh -k <name>    # Run specific test
./scripts/run_tests.sh --cov        # Coverage report
```

---

## API Guidelines

### Request/Response Format

All APIs return JSON:

```json
{
  "data": { },
  "error": null,
  "status": "success"
}
```

Or on error:

```json
{
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID xyz not found",
    "statusCode": 404
  },
  "status": "error"
}
```

### Status Codes

- `200` — Success
- `201` — Created
- `400` — Bad Request (validation failed)
- `403` — Forbidden (permission denied)
- `404` — Not Found
- `409` — Conflict (e.g., duplicate email)
- `500` — Server Error

### Validation

Always validate input:

```typescript
// Node.js: Use TypeBox
import { Type } from '@sinclair/typebox'

export const CreateUserSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1 })
})

// Python: Type hints + manual validation
def validate_amount(amount: float) -> bool:
    return isinstance(amount, (int, float)) and amount > 0
```

---

## Performance Considerations

### Database

- Use indexes for frequently queried fields (done: `users.email`, `cards.userId`, etc.)
- Avoid N+1 queries (use `include` in Prisma)
- Batch operations when possible

### Caching

- Cache user lookups in memory if frequently accessed
- Consider Redis for distributed caching
- Invalidate caches on updates

### API Response Time Targets

- Happy path: < 200ms
- With database: < 500ms
- With external call (Python processor): < 2000ms

---

## Security Considerations

### Input Validation

- Always validate and sanitize user input
- Use TypeBox schemas or Zod for validation
- Never trust client data

### Error Messages

- ✓ GOOD: "User not found"
- ✗ BAD: "User 123 not found in table users at 192.168.1.1"

### Environment Variables

- Store sensitive data in `.env` (never commit)
- Use `.env.example` as template
- Document all required variables

### SQL Injection

- Use Prisma (automatically safe)
- Never concatenate SQL queries
- Use parameterized queries

---

## Deployment

### Docker

```bash
# Build images
docker compose build

# Start services
docker compose up

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Environment

Production `.env`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/payments
PAYMENT_PROCESSOR_URL=http://processor:5000
LOG_LEVEL=info
```

---

## Need Help?

1. **Setup issues?** → See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **Questions?** → Open an issue on GitHub
3. **Found a bug?** → Create an issue with reproduction steps
4. **Have a suggestion?** → Create a discussion

---

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Tests pass (`npm run test` / `./scripts/run_tests.sh`)
- [ ] Linting passes (`npm run lint`)
- [ ] Types check (`npm run type-check`)
- [ ] New code has tests (aim for > 80% coverage)
- [ ] Documentation updated (if adding features)
- [ ] No console.log() left behind (use logger)
- [ ] Environment variables documented
- [ ] Commit messages follow conventions
- [ ] No breaking changes (or clearly documented)

---

## License

Apache