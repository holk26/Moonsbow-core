# Módulo: Apps

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/apps/router.py, backend/modules/apps/schemas.py -->

## Descripción

Registro de aplicaciones que consumen Moonsbow Core. Cada app recibe una `api_key` única para autenticación service-to-service vía header `X-API-Key`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/apps/` | JWT Bearer | Registrar nueva app |
| `GET` | `/api/v1/apps/` | JWT Bearer | Listar apps (paginado) |
| `GET` | `/api/v1/apps/{id}` | JWT Bearer | Obtener app por ID |
| `PUT` | `/api/v1/apps/{id}` | JWT Bearer | Actualizar app |
| `DELETE` | `/api/v1/apps/{id}` | JWT Bearer | Eliminar app |
| `POST` | `/api/v1/apps/{id}/rotate-key` | JWT Bearer | Rotar API key |

## Schemas

### Request: AppCreate

```typescript
interface AppCreate {
  name: string
  slug: string
  description?: string
  webhook_url?: string
}
```

```python
class AppCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    webhook_url: str | None = None
```

### Request: AppUpdate

```typescript
interface AppUpdate {
  name?: string
  description?: string
  webhook_url?: string
  is_active?: boolean
}
```

```python
class AppUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    webhook_url: str | None = None
    is_active: bool | None = None
```

### Response: AppResponse

```typescript
interface AppResponse {
  id: string // UUID
  name: string
  slug: string
  api_key: string
  webhook_url: string | null
  is_active: boolean
  description: string | null
}
```

```python
class AppResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    api_key: str
    webhook_url: str | None
    is_active: bool
    description: str | None
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";
const token = localStorage.getItem("token"); // JWT del usuario

async function createApp(data: AppCreate): Promise<AppResponse> {
  const res = await fetch(`${API_BASE}/api/v1/apps/`, {
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

async function rotateKey(appId: string): Promise<AppResponse> {
  const res = await fetch(`${API_BASE}/api/v1/apps/${appId}/rotate-key`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Uso
const app = await createApp({
  name: "Mi Integración",
  slug: "mi-integracion",
  webhook_url: "https://miservicio.com/webhooks",
});
console.log("API Key:", app.api_key);
```

## Ejemplo completo: Python

```python
import httpx
from uuid import UUID
from pydantic import BaseModel

API_BASE = "https://api.tudominio.com"
TOKEN = "..."  # JWT del usuario

class AppCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    webhook_url: str | None = None

async def create_app(data: AppCreate) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/apps/",
            json=data.model_dump(exclude_none=True),
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()

async def rotate_key(app_id: UUID) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/apps/{app_id}/rotate-key",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()
```

## Errores comunes

- `401 Unauthorized` — JWT faltante o expirado.
- `409 Conflict` — Slug duplicado.
- `404 Not Found` — App ID no existe.

## Patrones recomendados

- **Guardar API Key de forma segura:** Usa variables de entorno o secret managers. Nunca la hardcodees en repositorios públicos.
- **Rotación periódica:** Implementa rotación de API keys cada 90 días usando `POST /rotate-key`.
- **Webhook URL:** Registra la URL de webhooks al crear la app para recibir eventos sin configuración adicional.
