# OrbitPay Backend

This directory contains the backend services for OrbitPay:

- `api`: Express analytics API backed by PostgreSQL and Redis
- `indexer`: event indexer shell with its own health endpoint

The backend stack is designed to run locally with Docker Compose from the
repository root.

## Services

### API

The API service currently provides:

- `GET /health`
- `GET /api/streams`
- `GET /api/streams/:id`
- `GET /api/treasury/:addr/events`
- `GET /api/proposals`
- `GET /api/proposals/:id`
- `GET /api/proposals/:id/votes`
- `GET /api/vesting`
- `GET /api/vesting/:id/progress`

Security hardening included in this backend shell:

- rate limiting at `100 req/min` per IP
- exponential backoff for repeated violations
- `429 Too Many Requests` responses with `Retry-After`

### Indexer

The indexer service is a shell for the Soroban event poller. It currently:

- starts as a separate service
- performs a recurring placeholder poll loop
- exposes `GET /health`
- verifies PostgreSQL and Redis connectivity for stack health

BK-2 can build directly on top of this entrypoint.

## Environment

For Docker Compose from the repository root:

```bash
cp .env.example .env
```

For running the backend directly from this directory:

```bash
cp backend/.env.example backend/.env
```

Key variables:

- `DATABASE_URL`
- `REDIS_URL`
- `PORT`
- `INDEXER_PORT`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_BACKOFF_BASE_SECONDS`
- `INDEXER_POLL_INTERVAL_MS`

## Docker Compose

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

The stack includes:

- API
- Indexer
- PostgreSQL
- Redis

Persistent data is stored in named Docker volumes:

- `orbitpay_postgres_data`
- `orbitpay_redis_data`

## Local Backend Development

Install dependencies:

```bash
cd backend
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run the API:

```bash
npm run dev:api
```

Run the indexer:

```bash
npm run dev:indexer
```

Build the backend:

```bash
npm run build
```

## Database Schema

Prisma models and migrations are included for these core tables:

- `organizations`
- `treasury_events`
- `streams`
- `vesting_schedules`
- `proposals`

Supporting tables are also included for relational data:

- `proposal_votes`
- `claim_events`

Apply migrations:

```bash
npm run prisma:migrate:deploy
```

## Health Checks

Service health endpoints:

- API: `http://localhost:3001/health`
- Indexer: `http://localhost:3002/health`

Both endpoints verify:

- PostgreSQL connectivity
- Redis connectivity
- service uptime

## Notes

- Docker Compose health checks are configured for all four services.
- The indexer is intentionally a shell in this branch so BK-2 can add real
  Soroban polling without reworking the service layout.
- The API and indexer share the same backend image and Prisma schema.
