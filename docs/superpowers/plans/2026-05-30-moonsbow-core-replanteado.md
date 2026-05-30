# Moonsbow Core Replanteado — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replantear Moonsbow Core eliminando plugins de producto y añadiendo el concepto de Apps registradas, autenticación por API Key y webhooks con delivery asíncrono.

**Architecture:** El backend se simplifica a módulos de plataforma (auth, tenants, billing, notifications, events) más dos nuevos módulos: `apps` y `webhooks`. Cada app hija se registra en Moonsbow y obtiene una API Key para autenticar requests. Los eventos se emiten vía el dispatcher existente y un Celery task entrega webhooks suscritos.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Celery + Redis, Next.js 16, TypeScript

---

## File Structure

### Nuevos archivos (backend)

| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/modules/apps/models.py` | Modelo SQLAlchemy `App` |
| `backend/modules/apps/schemas.py` | Pydantic schemas para App |
| `backend/modules/apps/repository.py` | Acceso a BD para App |
| `backend/modules/apps/service.py` | Lógica de negocio de App |
| `backend/modules/apps/router.py` | Endpoints REST de App |
| `backend/modules/webhooks/models.py` | Modelo SQLAlchemy `WebhookSubscription` |
| `backend/modules/webhooks/schemas.py` | Pydantic schemas para Webhook |
| `backend/modules/webhooks/repository.py` | Acceso a BD para Webhook |
| `backend/modules/webhooks/service.py` | Lógica de suscripción y delivery |
| `backend/modules/webhooks/router.py` | Endpoints REST de Webhook |
| `backend/modules/webhooks/tasks.py` | Celery task para delivery de webhooks |
| `backend/core/security/api_key.py` | Dependency `get_current_app` para auth por API Key |

### Archivos modificados (backend)

| Archivo | Cambio |
|---------|--------|
| `backend/api/router.py` | Eliminar routers de plugins; añadir `apps_router` y `webhooks_router` |
| `backend/core/database/session.py` | Registrar nuevos modelos; eliminar imports de plugins |
| `backend/core/events/dispatcher.py` | Integrar con webhook delivery |
| `backend/workers/worker.py` | Incluir `backend.modules.webhooks.tasks` |
| `backend/modules/tenants/models.py` | Añadir `app_id` |
| `backend/modules/billing/models.py` | Añadir `app_id` |
| `backend/modules/notifications/models.py` | Añadir `app_id` |

### Archivos eliminados

- `backend/plugins/lms/` (completo)
- `backend/plugins/restaurant/` (completo)
- `backend/plugins/finance/` (completo)

### Frontend (nuevos/modificados)

| Archivo | Cambio |
|---------|--------|
| `frontend/app/(dashboard)/apps/page.tsx` | Lista de apps |
| `frontend/app/(dashboard)/apps/new/page.tsx` | Crear app |
| `frontend/app/(dashboard)/apps/[id]/page.tsx` | Detalle de app |
| `frontend/app/(dashboard)/apps/[id]/webhooks/page.tsx` | Webhooks de app |
| `frontend/components/layout/sidebar.tsx` | Eliminar enlaces a LMS/Restaurant/Finance; añadir Apps |

---

## Tareas

---

### Task 1: Eliminar plugins del backend

**Files:**
- Eliminar: `backend/plugins/lms/`
- Eliminar: `backend/plugins/restaurant/`
- Eliminar: `backend/plugins/finance/`
- Modificar: `backend/api/router.py`
- Modificar: `backend/core/database/session.py`

- [ ] **Step 1: Eliminar directorios de plugins**

```bash
rm -rf backend/plugins/lms
rm -rf backend/plugins/restaurant
rm -rf backend/plugins/finance
```

- [ ] **Step 2: Limpiar `backend/api/router.py`**

Reemplazar todo el contenido por:

```python
from fastapi import APIRouter

from backend.api.health import router as health_router
from backend.modules.auth.router import router as auth_router
from backend.modules.tenants.router import router as tenants_router
from backend.modules.billing.router import router as billing_router
from backend.modules.events.router import router as events_router
from backend.modules.notifications.router import router as notifications_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(billing_router)
api_router.include_router(events_router)
api_router.include_router(notifications_router)
```

- [ ] **Step 3: Limpiar `backend/core/database/session.py`**

Reemplazar la función `init_db` por:

```python
async def init_db() -> None:
    from backend.core.database.base import Base  # noqa: F401
    # Import all models to ensure they are registered
    import backend.modules.auth.models  # noqa: F401
    import backend.modules.tenants.models  # noqa: F401
    import backend.modules.billing.models  # noqa: F401
    import backend.modules.events.models  # noqa: F401
    import backend.modules.notifications.models  # noqa: F401

    logger.info("Database initialized")
```

- [ ] **Step 4: Verificar que el backend arranca**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
poetry run python -c "from backend.main import app; print('OK')"
```

Expected: `OK` (sin errores de importación)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: eliminar plugins lms, restaurant y finance"
```

---

### Task 2: Crear módulo `apps`

**Files:**
- Crear: `backend/modules/apps/__init__.py`
- Crear: `backend/modules/apps/models.py`
- Crear: `backend/modules/apps/schemas.py`
- Crear: `backend/modules/apps/repository.py`
- Crear: `backend/modules/apps/service.py`
- Crear: `backend/modules/apps/router.py`
- Modificar: `backend/api/router.py`
- Modificar: `backend/core/database/session.py`
- Crear: `tests/test_apps.py`

- [ ] **Step 1: Crear modelo `App`**

`backend/modules/apps/models.py`:

```python
import uuid
from sqlalchemy import String, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database.base import BaseModel


class App(BaseModel):
    __tablename__ = "apps"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    api_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
```

- [ ] **Step 2: Crear schemas**

`backend/modules/apps/schemas.py`:

```python
import uuid
from pydantic import BaseModel, ConfigDict


class AppCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    webhook_url: str | None = None


class AppUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    webhook_url: str | None = None
    is_active: bool | None = None


class AppResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    api_key: str
    webhook_url: str | None
    is_active: bool
    description: str | None
```

- [ ] **Step 3: Crear repository**

`backend/modules/apps/repository.py`:

```python
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.apps.models import App


class AppRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> App:
        app = App(**kwargs)
        self.db.add(app)
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def get_by_id(self, app_id: uuid.UUID) -> App | None:
        result = await self.db.execute(select(App).where(App.id == app_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> App | None:
        result = await self.db.execute(select(App).where(App.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_api_key(self, api_key: str) -> App | None:
        result = await self.db.execute(select(App).where(App.api_key == api_key))
        return result.scalar_one_or_none()

    async def list_all(self, page: int = 1, size: int = 20):
        offset = (page - 1) * size
        result = await self.db.execute(select(App).offset(offset).limit(size))
        return result.scalars().all()

    async def update(self, app: App, **kwargs) -> App:
        for key, value in kwargs.items():
            if value is not None:
                setattr(app, key, value)
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def delete(self, app: App) -> None:
        await self.db.delete(app)
```

- [ ] **Step 4: Crear service**

`backend/modules/apps/service.py`:

```python
import uuid
import secrets
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.apps.repository import AppRepository
from backend.modules.apps.schemas import AppCreate, AppUpdate, AppResponse


class AppService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AppRepository(db)

    def _generate_api_key(self) -> str:
        return f"mb_{secrets.token_urlsafe(32)}"

    async def create(self, data: AppCreate) -> AppResponse:
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="App with this slug already exists",
            )
        app = await self.repo.create(
            name=data.name,
            slug=data.slug,
            description=data.description,
            webhook_url=data.webhook_url,
            api_key=self._generate_api_key(),
        )
        return AppResponse.model_validate(app)

    async def get(self, app_id: uuid.UUID) -> AppResponse:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        return AppResponse.model_validate(app)

    async def list(self, page: int = 1, size: int = 20):
        apps = await self.repo.list_all(page=page, size=size)
        return [AppResponse.model_validate(a) for a in apps]

    async def update(self, app_id: uuid.UUID, data: AppUpdate) -> AppResponse:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        app = await self.repo.update(
            app,
            name=data.name,
            description=data.description,
            webhook_url=data.webhook_url,
            is_active=data.is_active,
        )
        return AppResponse.model_validate(app)

    async def delete(self, app_id: uuid.UUID) -> None:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        await self.repo.delete(app)

    async def rotate_key(self, app_id: uuid.UUID) -> AppResponse:
        app = await self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="App not found")
        app = await self.repo.update(app, api_key=self._generate_api_key())
        return AppResponse.model_validate(app)
```

- [ ] **Step 5: Crear router**

`backend/modules/apps/router.py`:

```python
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database.session import get_db
from backend.core.security.dependencies import get_current_user
from backend.modules.apps.service import AppService
from backend.modules.apps.schemas import AppCreate, AppUpdate, AppResponse

router = APIRouter(prefix="/apps", tags=["apps"])


@router.post("/", response_model=AppResponse, status_code=201)
async def create_app(
    data: AppCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.create(data)


@router.get("/", response_model=list[AppResponse])
async def list_apps(
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
    page: int = 1,
    size: int = 20,
):
    service = AppService(db)
    return await service.list(page=page, size=size)


@router.get("/{app_id}", response_model=AppResponse)
async def get_app(
    app_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.get(app_id)


@router.put("/{app_id}", response_model=AppResponse)
async def update_app(
    app_id: uuid.UUID,
    data: AppUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.update(app_id, data)


@router.delete("/{app_id}", status_code=204)
async def delete_app(
    app_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    await service.delete(app_id)


@router.post("/{app_id}/rotate-key", response_model=AppResponse)
async def rotate_app_key(
    app_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _=Depends(get_current_user),
):
    service = AppService(db)
    return await service.rotate_key(app_id)
```

- [ ] **Step 6: Crear `__init__.py`**

`backend/modules/apps/__init__.py`:

```python
# apps module
```

- [ ] **Step 7: Registrar router y modelo**

Modificar `backend/api/router.py`:

```python
from fastapi import APIRouter

from backend.api.health import router as health_router
from backend.modules.auth.router import router as auth_router
from backend.modules.tenants.router import router as tenants_router
from backend.modules.billing.router import router as billing_router
from backend.modules.events.router import router as events_router
from backend.modules.notifications.router import router as notifications_router
from backend.modules.apps.router import router as apps_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(billing_router)
api_router.include_router(events_router)
api_router.include_router(notifications_router)
api_router.include_router(apps_router)
```

Modificar `backend/core/database/session.py`, añadir en `init_db`:

```python
    import backend.modules.apps.models  # noqa: F401
```

- [ ] **Step 8: Escribir tests**

`tests/test_apps.py`:

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_app(client: AsyncClient):
    # Login first
    await client.post("/api/v1/auth/register", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    response = await client.post(
        "/api/v1/apps/",
        json={"name": "Test App", "slug": "test-app"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test App"
    assert data["slug"] == "test-app"
    assert data["api_key"].startswith("mb_")
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_apps(client: AsyncClient):
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    response = await client.get(
        "/api/v1/apps/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_rotate_app_key(client: AsyncClient):
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@apps.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    # Create app
    create = await client.post(
        "/api/v1/apps/",
        json={"name": "Rotate App", "slug": "rotate-app"},
        headers={"Authorization": f"Bearer {token}"},
    )
    app_id = create.json()["id"]
    old_key = create.json()["api_key"]

    # Rotate
    response = await client.post(
        f"/api/v1/apps/{app_id}/rotate-key",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    new_key = response.json()["api_key"]
    assert new_key != old_key
```

- [ ] **Step 9: Ejecutar tests**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
poetry run pytest tests/test_apps.py -v
```

Expected: 3 passed

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add apps module with CRUD and API key generation"
```

---

### Task 3: Crear módulo `webhooks`

**Files:**
- Crear: `backend/modules/webhooks/__init__.py`
- Crear: `backend/modules/webhooks/models.py`
- Crear: `backend/modules/webhooks/schemas.py`
- Crear: `backend/modules/webhooks/repository.py`
- Crear: `backend/modules/webhooks/service.py`
- Crear: `backend/modules/webhooks/router.py`
- Crear: `backend/modules/webhooks/tasks.py`
- Modificar: `backend/api/router.py`
- Modificar: `backend/core/database/session.py`
- Modificar: `backend/workers/worker.py`
- Crear: `tests/test_webhooks.py`

- [ ] **Step 1: Crear modelo `WebhookSubscription`**

`backend/modules/webhooks/models.py`:

```python
import uuid
from sqlalchemy import String, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database.base import BaseModel


class WebhookSubscription(BaseModel):
    __tablename__ = "webhook_subscriptions"

    app_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    event_types: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    secret: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
```

- [ ] **Step 2: Crear schemas**

`backend/modules/webhooks/schemas.py`:

```python
import uuid
from pydantic import BaseModel, ConfigDict


class WebhookCreate(BaseModel):
    event_types: list[str]
    url: str


class WebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    app_id: uuid.UUID
    event_types: list[str]
    url: str
    secret: str
    is_active: bool
```

- [ ] **Step 3: Crear repository**

`backend/modules/webhooks/repository.py`:

```python
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.webhooks.models import WebhookSubscription


class WebhookRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> WebhookSubscription:
        sub = WebhookSubscription(**kwargs)
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def get_by_id(self, sub_id: uuid.UUID) -> WebhookSubscription | None:
        result = await self.db.execute(select(WebhookSubscription).where(WebhookSubscription.id == sub_id))
        return result.scalar_one_or_none()

    async def list_by_app(self, app_id: uuid.UUID):
        result = await self.db.execute(
            select(WebhookSubscription).where(WebhookSubscription.app_id == app_id)
        )
        return result.scalars().all()

    async def list_active_by_event(self, event_type: str):
        result = await self.db.execute(
            select(WebhookSubscription).where(
                WebhookSubscription.is_active == True,
                WebhookSubscription.event_types.contains([event_type]),
            )
        )
        return result.scalars().all()

    async def delete(self, sub: WebhookSubscription) -> None:
        await self.db.delete(sub)
```

- [ ] **Step 4: Crear service**

`backend/modules/webhooks/service.py`:

```python
import uuid
import secrets
import hmac
import hashlib
import json
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.modules.webhooks.repository import WebhookRepository
from backend.modules.webhooks.schemas import WebhookCreate, WebhookResponse


class WebhookService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WebhookRepository(db)

    def _generate_secret(self) -> str:
        return secrets.token_urlsafe(32)

    def _sign_payload(self, payload: str, secret: str) -> str:
        return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

    async def create(self, app_id: uuid.UUID, data: WebhookCreate) -> WebhookResponse:
        sub = await self.repo.create(
            app_id=app_id,
            event_types=data.event_types,
            url=data.url,
            secret=self._generate_secret(),
        )
        return WebhookResponse.model_validate(sub)

    async def get(self, sub_id: uuid.UUID, app_id: uuid.UUID) -> WebhookResponse:
        sub = await self.repo.get_by_id(sub_id)
        if not sub or sub.app_id != app_id:
            raise HTTPException(status_code=404, detail="Webhook not found")
        return WebhookResponse.model_validate(sub)

    async def list_by_app(self, app_id: uuid.UUID) -> list[WebhookResponse]:
        subs = await self.repo.list_by_app(app_id)
        return [WebhookResponse.model_validate(s) for s in subs]

    async def delete(self, sub_id: uuid.UUID, app_id: uuid.UUID) -> None:
        sub = await self.repo.get_by_id(sub_id)
        if not sub or sub.app_id != app_id:
            raise HTTPException(status_code=404, detail="Webhook not found")
        await self.repo.delete(sub)

    async def get_active_subscriptions(self, event_type: str):
        return await self.repo.list_active_by_event(event_type)

    def build_payload(self, event_id: str, event_type: str, app_id: uuid.UUID, data: dict) -> str:
        import datetime
        payload = {
            "event_id": event_id,
            "event_type": event_type,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "app_id": str(app_id),
            "data": data,
        }
        return json.dumps(payload, default=str)
```

- [ ] **Step 5: Crear Celery task para delivery**

`backend/modules/webhooks/tasks.py`:

```python
import logging
import json
import hmac
import hashlib
from datetime import datetime, timezone

import httpx
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=4)
def deliver_webhook(self, url: str, secret: str, payload: str):
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": f"sha256={signature}",
    }
    try:
        response = httpx.post(url, headers=headers, content=payload, timeout=30.0)
        response.raise_for_status()
        logger.info(f"Webhook delivered to {url}: {response.status_code}")
    except Exception as exc:
        logger.warning(f"Webhook delivery failed to {url}: {exc}")
        retry_in = [60, 300, 900, 3600][self.request.retries]
        raise self.retry(exc=exc, countdown=retry_in)
```

- [ ] **Step 6: Crear router**

`backend/modules/webhooks/router.py`:

```python
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database.session import get_db
from backend.core.security.api_key import get_current_app
from backend.modules.webhooks.service import WebhookService
from backend.modules.webhooks.schemas import WebhookCreate, WebhookResponse
from backend.modules.apps.models import App

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    data: WebhookCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    return await service.create(app.id, data)


@router.get("/", response_model=list[WebhookResponse])
async def list_webhooks(
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    return await service.list_by_app(app.id)


@router.get("/{sub_id}", response_model=WebhookResponse)
async def get_webhook(
    sub_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    return await service.get(sub_id, app.id)


@router.delete("/{sub_id}", status_code=204)
async def delete_webhook(
    sub_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    app: App = Depends(get_current_app),
):
    service = WebhookService(db)
    await service.delete(sub_id, app.id)
```

- [ ] **Step 7: Crear `__init__.py`**

`backend/modules/webhooks/__init__.py`:

```python
# webhooks module
```

- [ ] **Step 8: Registrar en routers, DB y Celery**

Modificar `backend/api/router.py`:

```python
from fastapi import APIRouter

from backend.api.health import router as health_router
from backend.modules.auth.router import router as auth_router
from backend.modules.tenants.router import router as tenants_router
from backend.modules.billing.router import router as billing_router
from backend.modules.events.router import router as events_router
from backend.modules.notifications.router import router as notifications_router
from backend.modules.apps.router import router as apps_router
from backend.modules.webhooks.router import router as webhooks_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(billing_router)
api_router.include_router(events_router)
api_router.include_router(notifications_router)
api_router.include_router(apps_router)
api_router.include_router(webhooks_router)
```

Modificar `backend/core/database/session.py`, añadir en `init_db`:

```python
    import backend.modules.webhooks.models  # noqa: F401
```

Modificar `backend/workers/worker.py`:

```python
celery_app = Celery(
    "moonsbow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "backend.workers.tasks.email_tasks",
        "backend.workers.tasks.analytics_tasks",
        "backend.workers.tasks.ai_tasks",
        "backend.modules.webhooks.tasks",
    ],
)
```

- [ ] **Step 9: Escribir tests**

`tests/test_webhooks.py`:

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_webhook(client: AsyncClient):
    # Setup: register and login
    await client.post("/api/v1/auth/register", json={
        "email": "wh@webhook.test",
        "password": "password123",
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "wh@webhook.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    # Create app
    app_resp = await client.post(
        "/api/v1/apps/",
        json={"name": "Webhook App", "slug": "webhook-app"},
        headers={"Authorization": f"Bearer {token}"},
    )
    api_key = app_resp.json()["api_key"]

    # Create webhook using API Key
    response = await client.post(
        "/api/v1/webhooks/",
        json={"event_types": ["user.created"], "url": "https://example.com/webhook"},
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["event_types"] == ["user.created"]
    assert data["url"] == "https://example.com/webhook"
    assert len(data["secret"]) > 0


@pytest.mark.asyncio
async def test_list_webhooks(client: AsyncClient):
    login = await client.post("/api/v1/auth/login", json={
        "email": "wh@webhook.test",
        "password": "password123",
    })
    token = login.json()["access_token"]

    app_resp = await client.get(
        "/api/v1/apps/",
        headers={"Authorization": f"Bearer {token}"},
    )
    api_key = app_resp.json()[0]["api_key"]

    response = await client.get(
        "/api/v1/webhooks/",
        headers={"X-API-Key": api_key},
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1
```

- [ ] **Step 10: Ejecutar tests**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
poetry run pytest tests/test_webhooks.py -v
```

Expected: 2 passed

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add webhooks module with subscription and celery delivery"
```

---

### Task 4: Ajustar modelos existentes (app_id)

**Files:**
- Modificar: `backend/modules/tenants/models.py`
- Modificar: `backend/modules/billing/models.py`
- Modificar: `backend/modules/notifications/models.py`
- Modificar: schemas correspondientes (opcional, si se necesitan app_id en responses)

- [ ] **Step 1: Añadir `app_id` a Tenant**

`backend/modules/tenants/models.py`:

```python
import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database.base import BaseModel


class Tenant(BaseModel):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    app_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
```

- [ ] **Step 2: Añadir `app_id` a Subscription**

`backend/modules/billing/models.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database.base import BaseModel


class Subscription(BaseModel):
    __tablename__ = "subscriptions"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    app_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
```

- [ ] **Step 3: Añadir `app_id` a Notification**

`backend/modules/notifications/models.py`:

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.core.database.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    app_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 4: Ejecutar tests existentes**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
poetry run pytest tests/ -v --ignore=tests/test_apps.py --ignore=tests/test_webhooks.py
```

Expected: Los tests de auth y health pasan (pueden fallar si usan esquema antiguo, pero en SQLite memory deberían crear el nuevo esquema)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add app_id to tenants, subscriptions and notifications"
```

---

### Task 5: Auth por API Key

**Files:**
- Crear: `backend/core/security/api_key.py`
- Modificar: `backend/modules/webhooks/router.py` (ya usa `get_current_app`, verificar que funcione)

- [ ] **Step 1: Crear dependency `get_current_app`**

`backend/core/security/api_key.py`:

```python
import logging
from fastapi import Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database.session import get_db
from backend.modules.apps.repository import AppRepository

logger = logging.getLogger(__name__)


async def get_current_app(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = get_db(),
):
    """Dependency to authenticate requests from registered apps via API Key."""
    # get_db returns an AsyncGenerator, we need to async-for it
    async for session in db:
        repo = AppRepository(session)
        app = await repo.get_by_api_key(x_api_key)
        if not app:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key",
            )
        if not app.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="App is inactive",
            )
        return app
```

**Nota:** El patrón `db: AsyncSession = Depends(get_db)` no funciona directamente con `get_db()` porque es un generador. En FastAPI, `Depends` maneja esto automáticamente. La forma correcta es:

```python
from fastapi import Depends

async def get_current_app(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
):
    repo = AppRepository(db)
    app = await repo.get_by_api_key(x_api_key)
    if not app:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    if not app.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="App is inactive",
        )
    return app
```

Reescribir `backend/core/security/api_key.py` con la versión correcta usando `Depends`.

- [ ] **Step 2: Verificar que webhooks router ya lo usa**

Revisar que `backend/modules/webhooks/router.py` tenga:

```python
from backend.core.security.api_key import get_current_app
```

y que los endpoints usen `app: App = Depends(get_current_app)`.

- [ ] **Step 3: Ejecutar tests de webhooks**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
poetry run pytest tests/test_webhooks.py -v
```

Expected: 2 passed

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add API Key authentication for service-to-service requests"
```

---

### Task 6: Integrar eventos con webhook delivery

**Files:**
- Modificar: `backend/core/events/dispatcher.py`
- Modificar: `backend/modules/events/service.py`

- [ ] **Step 1: Potenciar dispatcher para emitir webhooks**

`backend/core/events/dispatcher.py`:

```python
import logging
import uuid
from collections import defaultdict
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)

EventHandler = Callable[[str, Any], Coroutine[Any, Any, None]]


class EventDispatcher:
    def __init__(self):
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        self._handlers[event_type].append(handler)
        logger.debug(f"Subscribed handler {handler.__name__} to event {event_type}")

    async def publish(self, event_type: str, payload: Any = None, app_id: uuid.UUID | None = None) -> None:
        handlers = self._handlers.get(event_type, [])
        logger.info(f"Publishing event {event_type} to {len(handlers)} handlers")
        for handler in handlers:
            try:
                await handler(event_type, payload)
            except Exception as e:
                logger.error(f"Handler {handler.__name__} failed for event {event_type}: {e}")
        
        # Trigger webhook delivery
        try:
            from backend.modules.webhooks.tasks import deliver_webhook
            from backend.modules.webhooks.service import WebhookService
            from backend.core.database.session import AsyncSessionLocal
            
            async with AsyncSessionLocal() as db:
                service = WebhookService(db)
                subs = await service.get_active_subscriptions(event_type)
                for sub in subs:
                    if app_id and sub.app_id != app_id:
                        continue
                    event_id = str(uuid.uuid4())
                    payload_str = service.build_payload(
                        event_id=event_id,
                        event_type=event_type,
                        app_id=sub.app_id,
                        data=payload or {},
                    )
                    deliver_webhook.delay(sub.url, sub.secret, payload_str)
        except Exception as e:
            logger.error(f"Webhook delivery trigger failed: {e}")


_dispatcher: EventDispatcher | None = None


def get_dispatcher() -> EventDispatcher:
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = EventDispatcher()
    return _dispatcher
```

- [ ] **Step 2: Emitir eventos desde servicios existentes**

`backend/modules/auth/service.py` — modificar `register` para emitir evento:

```python
    async def register(self, data: RegisterRequest) -> UserResponse:
        try:
            existing = await self.repo.get_by_email(data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User with this email already exists",
                )
            hashed = hash_password(data.password)
            user = await self.repo.create(
                email=data.email,
                password_hash=hashed,
                full_name=data.full_name,
                tenant_id=data.tenant_id,
            )
            
            # Emit event
            from backend.core.events.dispatcher import get_dispatcher
            dispatcher = get_dispatcher()
            await dispatcher.publish(
                "user.created",
                payload={"user_id": str(user.id), "email": user.email, "tenant_id": str(data.tenant_id) if data.tenant_id else None},
                app_id=None,  # Will deliver to all webhooks subscribed to user.created
            )
            
            return UserResponse.model_validate(user)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"REGISTRATION_ERROR_V2: {str(e)}",
            )
```

- [ ] **Step 3: Ejecutar tests**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
poetry run pytest tests/test_auth.py tests/test_apps.py tests/test_webhooks.py -v
```

Expected: todos pasan

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: integrate webhook delivery into event dispatcher"
```

---

### Task 7: Frontend — Apps y limpieza

**Files:**
- Eliminar/ignorar páginas de LMS, Restaurant, Finance (si existen)
- Crear: `frontend/app/(dashboard)/apps/page.tsx`
- Crear: `frontend/app/(dashboard)/apps/new/page.tsx`
- Crear: `frontend/app/(dashboard)/apps/[id]/page.tsx`
- Modificar: `frontend/components/layout/sidebar.tsx`
- Modificar: `frontend/lib/api.ts`

- [ ] **Step 1: Limpiar sidebar**

Eliminar enlaces a LMS, Restaurant, Finance en `frontend/components/layout/sidebar.tsx`. Añadir enlace a Apps.

Ejemplo de cambio:

```tsx
// Antes (ejemplo)
{ label: "LMS", href: "/lms" },
{ label: "Restaurante", href: "/restaurant" },
{ label: "Finanzas", href: "/finance" },

// Después
{ label: "Aplicaciones", href: "/apps" },
```

- [ ] **Step 2: Crear página de lista de Apps**

`frontend/app/(dashboard)/apps/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppsPage() {
  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => api.get("/apps").then((r) => r.data),
  });

  if (isLoading) return <p>Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aplicaciones</h1>
        <Button asChild>
          <Link href="/apps/new">Nueva App</Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {apps?.map((app: any) => (
          <div key={app.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{app.name}</h2>
                <p className="text-sm text-muted-foreground">{app.slug}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/apps/${app.id}`}>Ver</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear página de nueva App**

`frontend/app/(dashboard)/apps/new/page.tsx`:

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function NewAppPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.post("/apps", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      router.push("/apps");
    },
  });

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Nueva Aplicación</h1>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      <Button
        onClick={() => mutation.mutate({ name, slug })}
        disabled={!name || !slug}
      >
        Crear
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Crear página de detalle de App**

`frontend/app/(dashboard)/apps/[id]/page.tsx`:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function AppDetailPage() {
  const { id } = useParams();
  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: () => api.get(`/apps/${id}`).then((r) => r.data),
  });

  if (isLoading) return <p>Cargando...</p>;
  if (!app) return <p>App no encontrada</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{app.name}</h1>
      <div className="rounded-lg border p-4 space-y-2">
        <p><strong>Slug:</strong> {app.slug}</p>
        <p><strong>API Key:</strong> <code className="bg-muted px-1 rounded">{app.api_key}</code></p>
        <p><strong>Activo:</strong> {app.is_active ? "Sí" : "No"}</p>
        {app.webhook_url && <p><strong>Webhook URL:</strong> {app.webhook_url}</p>}
      </div>
      <Button
        onClick={() => api.post(`/apps/${id}/rotate-key`).then(() => window.location.reload())}
        variant="outline"
      >
        Rotar API Key
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Verificar build del frontend**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core/frontend
npm run build
```

Expected: build completa sin errores (puede haber warnings)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add frontend pages for apps and clean up plugin menus"
```

---

### Task 8: Actualizar documentación

**Files:**
- Modificar: `AGENTS.md`
- Modificar: `README.md`

- [ ] **Step 1: Actualizar `AGENTS.md`**

Reemplazar la sección de plugins en `AGENTS.md` para reflejar que ya no existen. Actualizar el diagrama de arquitectura. Actualizar la lista de módulos.

Ejemplo de cambios:
- Eliminar referencias a LMS, Restaurant, Finance
- Añadir `apps` y `webhooks` a la lista de módulos
- Actualizar el diagrama de flujo

- [ ] **Step 2: Actualizar `README.md`**

Similar a AGENTS.md, actualizar la descripción del proyecto para enfocarse en "SaaS toolkit centralizado" en lugar de "multi-producto".

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: update AGENTS.md and README to reflect replanted architecture"
```

---

## Self-Review

### Spec coverage check

| Requisito del spec | Tarea que lo implementa |
|-------------------|------------------------|
| Eliminar plugins (lms, restaurant, finance) | Task 1 |
| Crear modelo `App` + CRUD + API Key | Task 2 |
| Crear `WebhookSubscription` | Task 3 |
| Ajustar `Tenant`, `Subscription`, `Notification` (app_id) | Task 4 |
| Auth por API Key (`X-API-Key`) | Task 5 |
| Webhook delivery con Celery + HMAC | Task 3 (tasks.py) + Task 6 (dispatcher) |
| Frontend: Apps + limpieza | Task 7 |
| Documentación | Task 8 |

### Placeholder scan

- ✅ Sin TBD, TODO, "implement later"
- ✅ Cada tarea tiene código completo o comandos exactos
- ✅ Cada paso de test tiene código de test real
- ✅ Las firmas de funciones son consistentes entre tareas

### Type consistency

- `App.id` → `uuid.UUID` en todos lados
- `api_key` → `str` con prefijo `mb_`
- `WebhookSubscription.event_types` → `list[str]`
- `app_id` → `uuid.UUID | None` en modelos ajustados

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-30-moonsbow-core-replanteado.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
