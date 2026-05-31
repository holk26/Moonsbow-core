# Módulo: Notifications

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/notifications/router.py, backend/modules/notifications/schemas.py -->

## Descripción

Sistema de notificaciones. Permite enviar notificaciones a usuarios (email, sms, push) y marcarlas como leídas.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/notifications/` | JWT Bearer | Enviar notificación |
| `GET` | `/api/v1/notifications/{id}` | JWT Bearer | Obtener notificación |
| `GET` | `/api/v1/notifications/user/{user_id}/tenant/{tenant_id}` | JWT Bearer | Listar notificaciones de un usuario (paginado) |
| `PATCH` | `/api/v1/notifications/{id}/read` | JWT Bearer | Marcar como leída |

## Schemas

### Request: NotificationCreate

```typescript
interface NotificationCreate {
  tenant_id: string // UUID
  user_id?: string // UUID
  type: string // "email" | "sms" | "push"
  subject?: string
  content: string
}
```

```python
from uuid import UUID
from pydantic import BaseModel

class NotificationCreate(BaseModel):
    tenant_id: UUID
    user_id: UUID | None = None
    type: str  # email, sms, push
    subject: str | None = None
    content: str
```

### Response: NotificationResponse

```typescript
interface NotificationResponse {
  id: string // UUID
  tenant_id: string // UUID
  user_id: string | null
  type: string
  subject: string | null
  content: string
  is_read: boolean
  sent_at: string | null // ISO 8601
}
```

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tenant_id: UUID
    user_id: UUID | None
    type: str
    subject: str | None
    content: str
    is_read: bool
    sent_at: datetime | None
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";
const token = localStorage.getItem("token");

async function sendNotification(data: NotificationCreate): Promise<NotificationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/notifications/`, {
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

async function markAsRead(id: string): Promise<NotificationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Uso
const notif = await sendNotification({
  tenant_id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440001",
  type: "email",
  subject: "Bienvenido a Moonsbow",
  content: "Tu cuenta ha sido creada exitosamente.",
});
```

## Ejemplo completo: Python

```python
import httpx
from uuid import UUID
from pydantic import BaseModel

API_BASE = "https://api.tudominio.com"
TOKEN = "..."

class NotificationCreate(BaseModel):
    tenant_id: UUID
    user_id: UUID | None = None
    type: str
    subject: str | None = None
    content: str

async def send_notification(data: NotificationCreate) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/notifications/",
            json=data.model_dump(mode="json", exclude_none=True),
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()

async def mark_as_read(notif_id: UUID) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{API_BASE}/api/v1/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()
```

## Errores comunes

- `404 Not Found` — Notificación ID o User ID no existe.
- `422 Validation Error` — `type` no es uno de los valores permitidos.

## Patrones recomendados

- **Tipos:** Usa `"email"`, `"sms"` o `"push"`. No inventes tipos nuevos sin coordinar con el backend.
- **Subject opcional:** Para SMS/push, `subject` puede ser `null`. Para email, inclúyelo siempre.
- **Marcar leídas:** Llama `PATCH /read` cuando el usuario vea la notificación, no antes.
- **Badge de no leídas:** Consulta `GET /user/{user_id}/tenant/{tenant_id}` y filtra `is_read === false`.
