# Moonsbow-core

Moonsbow Core is a centralized SaaS toolkit that provides essential reusable infrastructure — authentication, app management, billing, notifications, and webhooks — to other applications within the same organization.

Built with FastAPI, PostgreSQL, and Redis, it serves as the backbone for multiple internal SaaS products by centralizing common concerns so each application can focus on its unique domain.

## Key Features

- **Authentication & user management** — JWT-based auth with registration and login
- **App registration** — Each consuming app registers and receives an API Key
- **Service-to-service auth** — API Key authentication via `X-API-Key` header
- **Billing & subscriptions** — CRUD for subscriptions and plans
- **Event system with webhooks** — Apps subscribe to events and receive signed webhook deliveries
- **Multi-tenant architecture** — Tenant isolation at the application layer
- **Background workers** — Celery tasks for email, analytics, and webhook delivery
- **Schema migrations** — Managed with Atlas
- **Containerized deployment** — Docker and Docker Compose support

## Architecture Overview

```
┌─────────────────┐     API REST      ┌──────────────────────────┐
│   App Comidas   │◄─────────────────►│                          │
│   (tu SaaS)     │                   │    Moonsbow Core         │
└─────────────────┘                   │    ┌─────────────────┐   │
        ▲                             │    │  Auth           │   │
        │ Webhooks                    │    │  Apps           │   │
        └─────────────────────────────┤    │  Tenants        │   │
                                      │    │  Billing        │   │
┌─────────────────┐     API REST      │    │  Notifications  │   │
│   App Gym       │◄─────────────────►│    │  Events         │   │
│   (tu SaaS)     │                   │    │  Webhooks       │   │
└─────────────────┘                   │    └─────────────────┘   │
        ▲                             │                          │
        │ Webhooks                    └──────────────────────────┘
        └──────────────────────────────────────────────────────────┘
```

## Project Goal

Moonsbow Core centralizes the common infrastructure required by multiple SaaS products, eliminating duplication and ensuring consistency across authentication, billing, and notifications.

## License

MIT
