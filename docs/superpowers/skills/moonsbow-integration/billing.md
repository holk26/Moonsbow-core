# Módulo: Billing

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/billing/router.py, backend/modules/billing/schemas.py -->

## Descripción

Gestión de suscripciones y planes. Permite crear suscripciones para tenants, consultarlas y actualizarlas.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/billing/subscriptions` | JWT Bearer | Crear suscripción |
| `GET` | `/api/v1/billing/subscriptions/{id}` | JWT Bearer | Obtener suscripción |
| `GET` | `/api/v1/billing/tenants/{tenant_id}/subscriptions` | JWT Bearer | Listar suscripciones de un tenant |
| `PUT` | `/api/v1/billing/subscriptions/{id}` | JWT Bearer | Actualizar suscripción |

## Schemas

### Request: SubscriptionCreate

```typescript
interface SubscriptionCreate {
  tenant_id: string // UUID
  plan: string
  status?: string // default "active"
  started_at?: string // ISO 8601
  expires_at?: string // ISO 8601
  external_id?: string
}
```

```python
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class SubscriptionCreate(BaseModel):
    tenant_id: UUID
    plan: str
    status: str = "active"
    started_at: datetime | None = None
    expires_at: datetime | None = None
    external_id: str | None = None
```

### Request: SubscriptionUpdate

```typescript
interface SubscriptionUpdate {
  plan?: string
  status?: string
  expires_at?: string // ISO 8601
}
```

```python
class SubscriptionUpdate(BaseModel):
    plan: str | None = None
    status: str | None = None
    expires_at: datetime | None = None
```

### Response: SubscriptionResponse

```typescript
interface SubscriptionResponse {
  id: string // UUID
  tenant_id: string // UUID
  plan: string
  status: string
  started_at: string | null
  expires_at: string | null
  external_id: string | null
}
```

```python
class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    plan: str
    status: str
    started_at: datetime | None
    expires_at: datetime | None
    external_id: str | None
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";
const token = localStorage.getItem("token");

async function createSubscription(data: SubscriptionCreate): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_BASE}/api/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateSubscription(id: string, data: SubscriptionUpdate): Promise<SubscriptionResponse> {
  const res = await fetch(`${API_BASE}/api/v1/billing/subscriptions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Uso
const sub = await createSubscription({
  tenant_id: "550e8400-e29b-41d4-a716-446655440000",
  plan: "pro",
  expires_at: "2027-01-01T00:00:00Z",
});
```

## Ejemplo completo: Python

```python
import httpx
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

API_BASE = "https://api.tudominio.com"
TOKEN = "..."

class SubscriptionCreate(BaseModel):
    tenant_id: UUID
    plan: str
    status: str = "active"
    started_at: datetime | None = None
    expires_at: datetime | None = None
    external_id: str | None = None

async def create_subscription(data: SubscriptionCreate) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/billing/subscriptions",
            json=data.model_dump(mode="json", exclude_none=True),
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()
```

## Errores comunes

- `401 Unauthorized` — JWT expirado.
- `404 Not Found` — Subscription ID o Tenant ID no existe.
- `422 Validation Error` — `tenant_id` no es un UUID válido.

## Patrones recomendados

- **Idempotencia:** Si integras con Stripe/Paddle, usa `external_id` para evitar duplicados.
- **Fechas:** Siempre envía fechas en formato ISO 8601 con zona horaria (`Z` o `+00:00`).
- **Caché local:** Cachea las suscripciones del tenant por unos minutos para reducir llamadas.
