# Payment System — Technical Test

A classroom-ready payment system demonstrating clean architecture, service collaboration, and REST API best practices.


```text
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

## Quick Links

- 🚀 **Getting Started:** [GETTING_STARTED.md](GETTING_STARTED.md)
- 🤝 **How to Contribute:** [CONTRIBUTING.md](CONTRIBUTING.md)
- 🛠️ **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 📄 **API Reference:** [postman/payment-system.postman_collection.json](postman/payment-system.postman_collection.json)

---

## Project Structure


```text
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

## Architecture Overview

- Node.js API Gateway (Fastify, TypeScript, Prisma)
- Python Payment Processor (stateless, stdlib only)
- PostgreSQL 16 (referential integrity, audit trail)
- Docker Compose for orchestration

---

For full setup, usage, and troubleshooting instructions, see [GETTING_STARTED.md](GETTING_STARTED.md).

For contribution guidelines and code standards, see [CONTRIBUTING.md](CONTRIBUTING.md).

For common errors and solutions, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
