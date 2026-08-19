# URL Shortener API

A production-grade, subscription-based URL shortener built with TypeScript, Express, PostgreSQL, and Prisma. Features JWT authentication with refresh-token rotation, plan-gated feature access, transactional link creation with row-level locking, and SSRF-safe URL validation.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js + TypeScript (ESM, `nodenext`) |
| Framework | Express 5 |
| Database | PostgreSQL 17 |
| ORM | Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) |
| Auth | JWT (HS256) + bcrypt + HttpOnly refresh-token cookies |
| Validation | Zod |
| Containerization | Docker Compose (PostgreSQL) |
| Dev tooling | tsx (watch mode), strict `tsconfig.json` |

## Architecture

```
Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
```

```
src/
├── modules/
│   ├── auth/           # Registration, login, JWT, refresh-token rotation
│   ├── links/          # Link CRUD, short-code generation, plan enforcement
│   ├── subscriptions/  # Plan resolution, subscription lookup
│   ├── usage/          # Daily usage counters, limit checks
│   └── redirect/       # Public short-code redirect, click recording
├── common/
├── config/             # Environment validation, auth config
├── database/           # Prisma client singleton
├── middleware/          # Error handler, auth middleware
├── app.ts
└── server.ts
```

## Features

### Authentication
- Registration with bcrypt-hashed passwords (cost 12)
- JWT access tokens (15 min, HS256)
- Refresh-token rotation with reuse detection (revokes all sessions on replay)
- Login timing equalization to prevent user enumeration
- HttpOnly `SameSite=Lax` refresh-token cookies

### Link Management
- Base62 short-code generation (`crypto.randomBytes` + rejection sampling)
- Collision-safe creation (retry loop outside transaction for Postgres `P2002`)
- SSRF-safe URL validation (blocks private IPs, metadata endpoints, non-HTTP protocols)
- Canonical URL normalization (lowercase host, stripped fragments/default ports)
- Duplicate destination reuse for same user
- Soft deletion with 7-day retention
- Status transitions (ACTIVE ↔ DISABLED, DELETED)

### Subscription Gating
- FREE and PRO plans enforced server-side
- Daily link-creation limits (5 FREE / 500 PRO)
- Active-link limits (20 FREE / 10,000 PRO)
- Plan-specific expiry (7 days FREE / up to 365 days PRO)
- Automatic FREE fallback on subscription expiry

### Redirect & Analytics
- Public `GET /:shortCode` → `302 Found` (no auth required)
- Click recording with user-agent parsing (browser, OS, device type)
- Per-link click counters

### Concurrency Safety
- `SELECT ... FOR UPDATE` row-level locking per user during link creation
- Transactional pipeline: lock → duplicate check → limit check → insert → counter upsert
- Atomic usage-counter upserts

### API Design
- RESTful endpoints under `/api/v1/`
- Uniform error responses: `{ error: { code, message } }`
- OpenAPI 3.0 specification (`openapi.yaml`)
- Liveness and readiness health checks

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm

### Setup

```bash
# Install dependencies
npm install

# Generate the Prisma Client (required — output is gitignored)
npx prisma generate

# Start PostgreSQL
docker compose up -d

# Apply migrations
npx prisma migrate deploy

# Seed FREE and PRO plans
npm run db:seed

# Start the dev server
npm run dev
```

The server starts at `http://localhost:3000` (configurable via `PORT` in `.env`).

### Environment Variables

Create a `.env` file:

```env
# Application
PORT=3000
DATABASE_URL=postgresql://url_app:password@localhost:5432/url_shortener
PUBLIC_BASE_URL=http://localhost:3000

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# PostgreSQL (used by Docker Compose)
POSTGRES_DB=url_shortener
POSTGRES_USER=url_app
POSTGRES_PASSWORD=password
```

## API Endpoints

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health/live` | No | Liveness probe |
| GET | `/health/ready` | No | Readiness probe |

### Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | No | Register a new user |
| POST | `/api/v1/auth/login` | No | Login, returns access token + refresh cookie |
| POST | `/api/v1/auth/refresh` | Cookie | Rotate refresh token, return new access token |
| POST | `/api/v1/auth/logout` | Cookie | Revoke refresh token |
| GET | `/api/v1/auth/me` | Bearer | Get current user |

### Links

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/links` | Bearer | Create a short link |
| GET | `/api/v1/links` | Bearer | List links (filter by status, paginated) |
| GET | `/api/v1/links/:id` | Bearer | Get link details |
| PATCH | `/api/v1/links/:id/status` | Bearer | Disable or reactivate a link |
| DELETE | `/api/v1/links/:id` | Bearer | Soft-delete a link |

### Public Redirect

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:shortCode` | No | Redirect to original URL |

### Error Codes

| Code | Meaning |
| --- | --- |
| `INVALID_URL` | Destination URL failed validation |
| `INVALID_CREDENTIALS` | Wrong email or password |
| `UNAUTHORIZED` | Missing or invalid auth token |
| `FORBIDDEN` | Insufficient permissions |
| `LINK_NOT_FOUND` | Link does not exist |
| `LINK_EXPIRED` | Link has expired |
| `LINK_DISABLED` | Link is disabled |
| `LINK_DELETED` | Link has been deleted |
| `SHORT_CODE_UNAVAILABLE` | Custom alias already taken |
| `PLAN_LIMIT_REACHED` | Daily or active-link limit exceeded |
| `FEATURE_NOT_AVAILABLE` | Not allowed on current plan |
| `VALIDATION_ERROR` | Request input failed validation |

## Database Schema

Seven tables with foreign keys, unique constraints, and composite indexes:

- **users** — email (unique), password hash, timestamps
- **plans** — type (FREE/PRO), limits, feature flags
- **subscriptions** — user-plan binding, status, date range
- **links** — original URL, short code (unique), status, click count, expiry
- **click_events** — per-click metadata (referrer, user-agent, timestamps)
- **usage_counters** — daily per-user link-creation counts (unique on user + date)
- **refresh_tokens** — hashed token, expiry, revocation timestamp

## Project Commands

```bash
npm run dev          # Start dev server with tsx watch
npm start            # Run once
npm run db:seed      # Seed/sync FREE and PRO plans (idempotent)
npx tsc --noEmit     # Type-check (strict mode)
npx prisma migrate dev      # Create and apply a new migration
npx prisma migrate deploy   # Apply tracked migrations
npx prisma generate         # Regenerate Prisma Client
npx prisma migrate status   # Check migration status
```

## License

ISC
