# Módulo: Events

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/events/router.py, backend/modules/events/schemas.py -->

## Descripción

Eventos de plataforma. Permite publicar eventos personalizados y consultar el historial de eventos de un tenant.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/events/` | JWT Bearer | Publicar evento |
| `GET` | `/api/v1/events/{id}` | JWT Bearer | Obtener evento por ID |
| `GET` | `/api/v1/events/tenant/{tenant_id}` | JWT Bearer | Listar eventos de un tenant (paginado) |

## Schemas

### Request: EventCreate

```typescript
interface EventCreate {
  tenant_id: string // UUID
  event_type: string
  source: string
  payload?: Record<string, any>
}
```

```python
from uuid import UUID
from pydantic import BaseModel

class EventCreate(BaseModel):
    tenant_id: UUID
    event_type: str
    source: str
    payload: dict | None = None
```

### Response: EventResponse

```typescript
interface EventResponse {
  id: string // UUID
  tenant_id: string // UUID
  event_type: string
  source: string
  payload: Record<string, any> | null
  status: string
}
```

```python
class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    event_type: str
    source: str
    payload: dict | None
    status: str
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";
const token = localStorage.getItem("token");

async function publishEvent(data: EventCreate): Promise<EventResponse> {
  const res = await fetch(`${API_BASE}/api/v1/events/`, {
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

async function listTenantEvents(tenantId: string, page = 1, size = 20): Promise<EventResponse[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/events/tenant/${tenantId}?page=${page}&size=${size}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Uso
const event = await publishEvent({
  tenant_id: "550e8400-e29b-41d4-a716-446655440000",
  event_type: "invoice.paid",
  source: "stripe-integration",
  payload: { amount: 9900, currency: "usd" },
});
```

## Ejemplo completo: Python

```python
import httpx
from uuid import UUID
from pydantic import BaseModel

API_BASE = "https://api.tudominio.com"
TOKEN = "..."

class EventCreate(BaseModel):
    tenant_id: UUID
    event_type: str
    source: str
    payload: dict | None = None

async def publish_event(data: EventCreate) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/events/",
            json=data.model_dump(mode="json", exclude_none=True),
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()

async def list_tenant_events(tenant_id: UUID, page: int = 1, size: int = 20) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{API_BASE}/api/v1/events/tenant/{tenant_id}",
            params={"page": page, "size": size},
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()
```

## Errores comunes

- `404 Not Found` — Tenant ID no existe.
- `422 Validation Error` — Payload no es un objeto JSON válido.

## Patrones recomendados

- **Source:** Usa un identificador único por servicio (ej: `"stripe-integration"`, `"crm-worker"`) para rastrear el origen de eventos.
- **Payload flexible:** El campo `payload` es un diccionario/libre; documenta internamente la estructura esperada por `event_type`.
- **Webhook cascade:** Los eventos publicados aquí pueden disparar webhooks si hay suscripciones activas.
