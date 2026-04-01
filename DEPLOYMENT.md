# Deployment Guide — Dokploy (Single Dockerfile)

This document explains how to deploy **Moonsbow Core** on [Dokploy](https://dokploy.com) using only the project `Dockerfile`, without Docker Compose.

---

## External services you need to provision

Moonsbow Core depends on two external services that you deploy once and reuse across every app service.

| Service    | Image              | Purpose                                               |
|------------|--------------------|-------------------------------------------------------|
| PostgreSQL | `postgres:15`      | Primary relational database (tenants, auth, etc.)     |
| Redis      | `redis:7-alpine`   | Cache, Celery message broker, and result backend       |

---

## Step-by-step: Dokploy deployment

### 1 — Create a shared Docker network

In Dokploy, go to **Networks → Create Network** and create a bridge network called `moonsbow_net`.  
All services (API, worker, Postgres, Redis) must be attached to this network so they can resolve each other by hostname.

> Alternatively run the following from your server CLI once:
> ```bash
> docker network create moonsbow_net
> ```

---

### 2 — Deploy PostgreSQL

In Dokploy, create a new **Service → Docker Image** with:

| Field             | Value                                 |
|-------------------|---------------------------------------|
| Image             | `postgres:15`                         |
| Network           | `moonsbow_net`                        |
| Hostname / alias  | `postgres`                            |

**Environment variables:**

```env
POSTGRES_USER=moonsbow
POSTGRES_PASSWORD=<choose-a-strong-password>
POSTGRES_DB=moonsbow
```

**Persistent volume** (to avoid data loss on restart):

Mount `/var/lib/postgresql/data` to a named volume (e.g. `postgres_data`).

**Optional init script** — to load `infra/postgres/init.sql` automatically, mount the file to `/docker-entrypoint-initdb.d/init.sql`.

---

### 3 — Deploy Redis

Create a new **Service → Docker Image** with:

| Field             | Value              |
|-------------------|--------------------|
| Image             | `redis:7-alpine`   |
| Network           | `moonsbow_net`     |
| Hostname / alias  | `redis`            |

**Persistent volume:** Mount `/data` to a named volume (e.g. `redis_data`).

No additional environment variables are required for a default Redis setup.

---

### 4 — Deploy the API (APP_MODE=api)

Create a new **Service → Application** pointing to your Git repository.

| Field       | Value                 |
|-------------|-----------------------|
| Dockerfile  | `Dockerfile` (root)   |
| Network     | `moonsbow_net`        |
| Port        | `8000`                |

**Environment variables** (copy from `.env.example` and fill in secrets):

```env
APP_MODE=api
APP_ENV=production
APP_PORT=8000
SECRET_KEY=<your-secret-key>
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
CORS_ORIGINS=["https://yourdomain.com"]

# Hostnames match the aliases set in steps 2 and 3
DATABASE_URL=postgresql+asyncpg://moonsbow:<password>@postgres:5432/moonsbow
ATLAS_DATABASE_URL=postgresql://moonsbow:<password>@postgres:5432/moonsbow
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

UVICORN_WORKERS=1
```

On every deployment the container will:
1. Wait for PostgreSQL to accept connections (up to 30 retries × 2 s).
2. Run `atlas migrate apply` to apply any pending DB migrations.
3. Wait for Redis to accept connections (up to 30 retries × 2 s).
4. Start the FastAPI server with Uvicorn.

**Health probe** — configure Dokploy's health check (or your load balancer) to hit `GET /api/v1/health`.  
The endpoint returns `200 OK` when both PostgreSQL and Redis are reachable, or `503 Service Unavailable` (with `"status": "degraded"`) when one or more dependencies are down.

> **Troubleshooting Bad Gateway**: if the reverse proxy returns 502/504, check the container logs for `ERROR: PostgreSQL … did not become ready` or `ERROR: Redis … did not become ready`. This means the dependency containers are not on the same Docker network or their hostnames differ from the values in `DATABASE_URL` / `REDIS_URL`.  Verify that all services share the `moonsbow_net` network and that the hostnames in the environment variables match the **service aliases** you set in steps 2 and 3.

---

### 5 — Deploy the Worker (APP_MODE=worker)

Create a **second** Service from the **same image/repository** with the single difference:

```env
APP_MODE=worker
CELERY_CONCURRENCY=4
# All other variables identical to the api service
```

The worker does **not** run migrations and does **not** expose any port.

---

## Environment variable reference

| Variable               | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `APP_MODE`             | `api` (default) or `worker`                                                 |
| `APP_ENV`              | `production` or `development` (enables `--reload` in dev)                   |
| `APP_PORT`             | Port the API listens on (default `8000`)                                    |
| `SECRET_KEY`           | JWT signing secret — keep this private and rotate periodically              |
| `DATABASE_URL`         | SQLAlchemy async URL using `postgresql+asyncpg://`                          |
| `ATLAS_DATABASE_URL`   | Plain `postgresql://` URL used by Atlas for migrations                      |
| `REDIS_URL`            | Redis URL for caching / session storage                                     |
| `CELERY_BROKER_URL`    | Redis URL used as Celery message broker (recommended: DB index 1)           |
| `CELERY_RESULT_BACKEND`| Redis URL used to store Celery task results (recommended: DB index 2)       |
| `UVICORN_WORKERS`      | Number of Uvicorn worker processes (production only, default `1`)           |
| `CELERY_CONCURRENCY`   | Number of Celery worker threads (default `4`)                               |

---

## Network topology

```
             ┌───────────────── moonsbow_net ─────────────────┐
             │                                                 │
  ┌──────────┴──────────┐   ┌──────────────┐   ┌───────────┐ │
  │  api  (port 8000)   │   │   worker     │   │  postgres │ │
  │  APP_MODE=api       │   │  APP_MODE=   │   │  :5432    │ │
  │  runs migrations    │   │   worker     │   └───────────┘ │
  └─────────────────────┘   └──────────────┘   ┌───────────┐ │
             │                      │           │   redis   │ │
             └──────────────────────┴───────────┤  :6379    │ │
                                                └───────────┘ │
             └────────────────────────────────────────────────┘
```

All services communicate using their **service hostname** (e.g. `postgres`, `redis`), which is why the connection strings use those names instead of `localhost`.

---

## Local development

A `docker-compose.yml` is included for running the complete stack locally:

```bash
cp .env.example .env
# edit .env and set SECRET_KEY at minimum
docker compose up --build
```

This starts the API, the worker, Postgres, and Redis all on the same local bridge network. The API is accessible at `http://localhost:8000`.
