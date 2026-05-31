# Moonsbow Core — Agent Guide

This document contains everything an AI coding agent needs to know to work effectively on the Moonsbow Core codebase. Moonsbow Core is a centralized SaaS toolkit that provides essential reusable infrastructure — authentication, billing, notifications, and webhooks — to other applications within the same organization.

---

## Project Overview

Moonsbow Core is a FastAPI-based backend with a Next.js admin dashboard frontend. It provides foundational infrastructure for SaaS applications including authentication, app registration, billing, events, notifications, and webhooks.

The architecture separates concerns into two layers:
- **Core** (`backend/core/`) — Infrastructure (database, security, config, events, utilities)
- **Modules** (`backend/modules/`) — Platform services (auth, tenants, billing, events, notifications, apps, webhooks)

Each application that consumes Moonsbow Core registers as an `App` and receives an API Key for service-to-service authentication. Webhooks allow apps to subscribe to events such as `user.created` and `subscription.updated`.

All business data is multi-tenant: every table includes a `tenant_id` column for isolation.

---

## Technology Stack

### Backend
- **Python** 3.11+
- **FastAPI** 0.111+ — Async web framework
- **SQLAlchemy** 2.0+ with `asyncio` extras — Async ORM
- **asyncpg** — Async PostgreSQL driver
- **PostgreSQL** 15 — Primary database
- **Redis** 7 — Cache, Celery broker, and result backend
- **Celery** 5.4+ — Background task workers
- **Pydantic** 2.7+ — Data validation and settings
- **python-jose** + **bcrypt** — JWT authentication and password hashing
- **structlog** — Structured logging
- **Poetry** 1.8+ — Dependency management

### Frontend
- **Next.js** 16.2+ (App Router)
- **React** 19.2+
- **TypeScript** 5+
- **Tailwind CSS** v4
- **shadcn/ui** (base-nova style, using `@base-ui/react`)
- **React Query** (@tanstack/react-query) — Server state management
- **React Hook Form** + **Zod** — Form handling and validation
- **Sonner** — Toast notifications
- **Lucide React** — Icons

### Infrastructure & Tooling
- **Docker** + **Docker Compose** — Local development
- **Atlas** (atlasgo.io) — Database schema migrations
- **Dokploy** — Production deployment target
- **Traefik** — Reverse proxy (local dev only)
- **Black** + **Ruff** — Python formatting and linting
- **pytest** + **pytest-asyncio** — Testing

---

## Project Structure

```
moonsbow-core/
├── backend/                  # Python backend
│   ├── api/                  # API router entrypoints
│   │   ├── router.py         # Aggregates all module routers under /api/v1
│   │   └── health.py         # Health check endpoint
│   ├── app.py                # FastAPI application factory (create_app)
│   ├── main.py               # Entry point: exports the FastAPI app
│   ├── core/                 # Infrastructure layer
│   │   ├── config/           # Settings (Pydantic-Settings) and logging
│   │   ├── database/         # SQLAlchemy base, session, engine
│   │   ├── security/         # JWT, password hashing, API Key auth, dependencies
│   │   ├── events/           # In-memory event dispatcher with webhook integration
│   │   └── utils/            # Pagination helpers, response wrappers
│   ├── modules/              # Platform modules
│   │   ├── auth/             # User registration, login, JWT
│   │   ├── tenants/          # Organization/tenant CRUD
│   │   ├── billing/          # Subscriptions and plans
│   │   ├── events/           # Platform event logging
│   │   ├── notifications/    # User notifications
│   │   ├── apps/             # App registration and API key management
│   │   └── webhooks/         # Webhook subscriptions and delivery
│   └── workers/              # Celery worker and tasks
│       ├── worker.py         # Celery app configuration
│       └── tasks/            # Background tasks (email, analytics, AI, webhooks)
├── frontend/                 # Next.js admin dashboard
│   ├── app/                  # App Router pages
│   │   ├── (auth)/           # Login / Register (unauthenticated)
│   │   ├── (dashboard)/      # Admin pages (authenticated)
│   │   └── layout.tsx        # Root layout with providers
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components (Button, Input, Card, etc.)
│   │   └── layout/           # Sidebar, Header, AuthGuard
│   ├── hooks/                # Custom React hooks (useAuth)
│   ├── lib/                  # Utilities, API client, TypeScript types
│   └── public/               # Static assets
├── tests/                    # Backend tests
│   ├── conftest.py           # Pytest fixtures (async DB + HTTP client)
│   ├── test_auth.py          # Auth endpoint tests
│   └── test_health.py        # Health check tests
├── migrations/               # Atlas SQL migrations
│   ├── schema.py             # SQLAlchemy schema exporter for Atlas
│   ├── atlas.sum             # Migration checksums
│   └── *.sql                 # Migration files
├── infra/                    # Infrastructure configs
│   ├── postgres/init.sql     # Optional init script
│   ├── redis/
│   └── traefik/
├── scripts/                  # Deployment and utility scripts
│   ├── entrypoint.sh         # Container entrypoint (api / worker modes)
│   └── init_default_user.py  # Creates default admin user
├── pyproject.toml            # Poetry dependencies, Black/Ruff/pytest config
├── docker-compose.yml        # Local stack (Traefik + API + Worker + Postgres + Redis)
├── Dockerfile                # Multi-stage Python image (api or worker)
├── Dockerfile.frontend       # Nginx static image for Next.js export
├── atlas.hcl                 # Atlas migration tool configuration
└── .env.example              # Required environment variables
```

### Module Internal Structure

Every module follows the same internal layout:

```
module_name/
├── __init__.py
├── router.py      # FastAPI routes
├── service.py     # Business logic
├── models.py      # SQLAlchemy ORM models
├── schemas.py     # Pydantic request/response models
├── repository.py  # Database access layer
└── tasks.py       # (webhooks only) Celery background tasks
```

---

## Build, Run, and Test Commands

### Backend

```bash
# Install dependencies (requires Poetry)
pip install poetry==1.8.3
poetry install

# Run the API server locally (requires Postgres + Redis)
poetry run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Run the Celery worker locally
poetry run celery -A backend.workers.worker worker --loglevel=info

# Run tests
poetry run pytest

# Format and lint
poetry run black backend/ tests/
poetry run ruff check backend/ tests/
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev        # http://localhost:3000

# Build static export
npm run build      # Outputs to frontend/dist

# Lint
npm run lint
```

### Full Stack (Docker Compose)

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env and set SECRET_KEY at minimum

# Start everything (Traefik, API, Worker, Postgres, Redis)
docker compose up --build

# API available at:  http://api.localhost
# Traefik dashboard:  http://localhost:8080
```

---

## Code Style Guidelines

### Python
- **Formatter**: Black with `line-length = 88`
- **Linter**: Ruff with `target-version = "py311"`
- **Type hints**: Use modern Python 3.11+ syntax (`str | None`, `list[str]`, etc.)
- **Async**: The entire backend is async-first. Database sessions use `AsyncSession`, routes use `async def`.
- **Imports**: Use absolute imports starting from `backend.` (e.g., `from backend.core.database.session import get_db`)
- **Models**: All ORM models inherit from `backend.core.database.base.BaseModel` which provides `id` (UUID), `created_at`, and `updated_at`.
- **Schemas**: Pydantic v2 models. Use `ConfigDict(from_attributes=True)` for ORM-compatible response models.

### TypeScript / Frontend
- Uses Tailwind CSS v4 (no `tailwind.config.js`; config is in `globals.css` or PostCSS)
- shadcn/ui components are located in `frontend/components/ui/`
- Use the `cn()` utility from `@/lib/utils` for conditional Tailwind class merging
- The UI language is **Spanish** (e.g., "Iniciar sesión", "Panel de administración")
- API base URL is set via `NEXT_PUBLIC_API_URL` (defaults to production URL)

---

## Testing Instructions

### Backend Tests
- Framework: **pytest** with **pytest-asyncio** (`asyncio_mode = auto`)
- Test database: In-memory **SQLite** (`sqlite+aiosqlite:///:memory:`) using `StaticPool`
- HTTP client: `httpx.AsyncClient` with `ASGITransport`
- The `conftest.py` fixture `client` automatically:
  1. Creates all tables from SQLAlchemy metadata
  2. Overrides `get_db` to use the test session
  3. Drops all tables after each test

```bash
# Run all tests
poetry run pytest

# Run with verbose output
poetry run pytest -v
```

### Writing New Tests
- Place test files in `tests/` with the `test_*.py` prefix
- Use `client: AsyncClient` fixture for API tests
- Use `db: AsyncSession` fixture for direct database tests
- Mark async tests with `@pytest.mark.asyncio`
- New tests for apps and webhooks exist: `tests/test_apps.py`, `tests/test_webhooks.py`

### Frontend Tests
There are currently no frontend tests configured. If you add them, place them alongside components or in a `frontend/__tests__/` directory.

---

## Security Considerations

### Authentication
- **JWT Bearer tokens** using `python-jose` (HS256 algorithm) — for human users (dashboard)
- **API Key authentication** (`X-API-Key` header) — for service-to-service requests from registered apps
- Passwords hashed with **bcrypt** via `passlib` (truncated at 71 characters due to bcrypt's 72-byte limit)
- Protected routes use `backend.core.security.dependencies.get_current_user` (HTTPBearer) for user routes
- App routes use `backend.core.security.api_key.get_current_app` for machine-to-machine routes
- `SECRET_KEY` must be at least 32 characters in production (enforced by Pydantic validator)

### Multi-Tenancy
- Every business table includes `tenant_id: UUID | None`
- Tenant isolation is currently enforced at the application layer (service/repository level), not at the database row-level security level
- The JWT token contains only the `sub` (user_id); tenant resolution happens in services

### Environment Secrets
The following variables must be kept secret and are validated at container startup:
- `SECRET_KEY` — JWT signing key
- `DATABASE_URL` — PostgreSQL connection
- `ATLAS_DATABASE_URL` — Plain `postgresql://` URL for Atlas migrations
- `REDIS_URL` — Redis connection

### CORS
- Configured via `CORS_ORIGINS` environment variable (JSON array string)
- Defaults to `http://localhost:3000` and `http://localhost:8000` in development

---

## Database and Migrations

### Schema Management
- **Atlas** is the migration tool. It reads the current schema from `migrations/schema.py` (SQLAlchemy reflection) and generates SQL diffs.
- Do **not** edit migration `.sql` files by hand without regenerating the checksum.

### Common Atlas Commands
```bash
# Generate a new migration from current SQLAlchemy models
atlas migrate diff --env local

# Apply pending migrations
atlas migrate apply --env local

# Regenerate checksums after manual edits
atlas migrate hash --dir "file://migrations"
```

### Model Registration
When you add a new SQLAlchemy model, import it in `backend/core/database/session.py` inside `init_db()` so that `Base.metadata.create_all()` and Atlas can see it.

### Connection URLs
- Application: `postgresql+asyncpg://...` (SQLAlchemy async)
- Atlas: `postgresql://...` (plain, no `+asyncpg`)

---

## Deployment Architecture

### Production (Dokploy)
The production deployment uses a **single Dockerfile** (not Docker Compose). External PostgreSQL and Redis services are deployed separately on a shared Docker network (`moonsbow_net`).

Two application services are deployed from the same image:
1. **API service** (`APP_MODE=api`) — Exposes port 8000, runs Atlas migrations on startup
2. **Worker service** (`APP_MODE=worker`) — No port exposed, runs Celery worker

See `DEPLOYMENT.md` for the full step-by-step Dokploy guide.

### Container Entrypoint (`scripts/entrypoint.sh`)
The entrypoint validates required env vars, then branches on `APP_MODE`:
- `api`: Runs `atlas migrate apply`, optionally creates default admin user, then starts Uvicorn
- `worker`: Starts Celery worker with configurable concurrency

### Local Development (Docker Compose)
The `docker-compose.yml` spins up:
- Traefik (reverse proxy at `:80`, dashboard at `:8080`)
- API (`api.localhost`)
- Worker
- PostgreSQL (`:5432`)
- Redis (`:6379`)

---

## Background Workers

Celery is configured in `backend/workers/worker.py` with Redis as both broker and result backend.

Task modules:
- `backend.workers.tasks.email_tasks` — Email sending (stubbed, retry-enabled)
- `backend.workers.tasks.analytics_tasks` — Analytics processing
- `backend.workers.tasks.ai_tasks` — AI/ML tasks

Invoke tasks from services using `.delay()` or `.apply_async()`.

---

## Event System

An in-memory async event dispatcher lives in `backend/core/events/dispatcher.py`.

- Services emit events via `dispatcher.publish(event_type, payload, app_id)`
- Handlers can be registered with `dispatcher.subscribe(event_type, handler)`
- The dispatcher automatically triggers webhook delivery for active subscriptions
- Webhooks are delivered asynchronously via Celery tasks with HMAC-SHA256 signing
- This is **not** a distributed message bus — for cross-process events, use Celery tasks

---

## Frontend Architecture Notes

- **Static export**: Next.js is configured with `output: "export"` and `distDir: "dist"`, producing a fully static site served by Nginx in production.
- **Auth**: Uses a React Context (`hooks/use-auth.tsx`) with localStorage for the JWT token. Includes a hardcoded dev user (`dev@moonsbow.com` / `dev123`) for local development.
- **API client**: `frontend/lib/api.ts` contains typed fetch wrappers for all backend endpoints. Automatically redirects to `/login` on 401.
- **Route groups**:
  - `(auth)/` — Unauthenticated pages (login, register)
  - `(dashboard)/` — Authenticated admin pages with sidebar layout

---

## Important Conventions

1. **No module depends on another module.** They may depend on core, but cross-module dependencies should be minimal.
2. **All routes are prefixed with `/api/v1`.** Router registration happens in `backend/api/router.py`.
3. **Database sessions auto-commit/rollback.** The `get_db()` dependency yields a session that commits on success and rolls back on exception.
4. **UUID primary keys.** All models use `UUID(as_uuid=True)` for `id`.
5. **Pagination.** List endpoints accept `page` and `size` query params. Responses use `PaginatedResponse[T]`.
6. **Error handling.** Services raise FastAPI `HTTPException` with appropriate status codes. The auth module returns `409` for duplicate emails, `401` for invalid credentials.

---

## Integration Skill

A Kimi Code skill lives in `docs/superpowers/skills/moonsbow-integration/` that teaches agents how to generate integration code for Moonsbow Core in JavaScript/TypeScript and Python.

**When modifying the public API (schemas, routers, or auth methods), you MUST update the corresponding skill file** so it stays in sync with the backend implementation. Each skill module file includes a sync comment at the top:

```markdown
<!-- Last synced with backend: YYYY-MM-DD -->
<!-- Source files: backend/modules/MODULE/router.py, backend/modules/MODULE/schemas.py -->
```

Update the date and source references after every API change.

### Skill structure

```
docs/superpowers/skills/moonsbow-integration/
├── SKILL.md          # Entry point: auth modes, conventions, base client
├── auth.md           # JWT auth (register, login, me)
├── apps.md           # App registration and API keys
├── webhooks.md       # Subscriptions and HMAC-SHA256 verification
├── billing.md        # Subscriptions
├── tenants.md        # Tenant/organization CRUD
├── events.md         # Platform events
└── notifications.md  # User notifications
```

### How to use the skill

When asked to write integration code, agents should:
1. Read `SKILL.md` first for base conventions and authentication
2. Read the specific module file (e.g., `webhooks.md`) for endpoint details
3. Generate code using the provided TypeScript and Python examples as templates

---

## Files to Know

| File | Purpose |
|------|---------|
| `backend/app.py` | FastAPI factory — add middleware or global exception handlers here |
| `backend/api/router.py` | Register new module routers here |
| `backend/core/database/session.py` | Import new models in `init_db()` |
| `backend/core/config/settings.py` | Add new environment variables here |
| `pyproject.toml` | Python deps, Black/Ruff/pytest config |
| `frontend/lib/api.ts` | Add new frontend API methods here |
| `frontend/lib/types.ts` | Shared TypeScript interfaces |
| `migrations/schema.py` | Atlas reads SQLAlchemy schema from here |
| `scripts/entrypoint.sh` | Container startup logic |
