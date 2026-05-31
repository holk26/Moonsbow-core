# Módulo: Tenants

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/tenants/router.py, backend/modules/tenants/schemas.py -->

## Descripción

Organizaciones o tenants en Moonsbow. Cada usuario puede pertenecer a un tenant. Los tenants permiten aislar datos entre organizaciones.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/tenants/` | JWT Bearer | Crear tenant |
| `GET` | `/api/v1/tenants/` | JWT Bearer | Listar tenants (paginado) |
| `GET` | `/api/v1/tenants/{id}` | JWT Bearer | Obtener tenant |
| `PUT` | `/api/v1/tenants/{id}` | JWT Bearer | Actualizar tenant |
| `DELETE` | `/api/v1/tenants/{id}` | JWT Bearer | Eliminar tenant |

## Schemas

### Request: TenantCreate

```typescript
interface TenantCreate {
  name: string
  slug: string
  plan?: string // default "free"
  description?: string
}
```

```python
class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"
    description: str | None = None
```

### Request: TenantUpdate

```typescript
interface TenantUpdate {
  name?: string
  slug?: string
  plan?: string
  description?: string
  is_active?: boolean
}
```

```python
class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    plan: str | None = None
    description: str | None = None
    is_active: bool | None = None
```

### Response: TenantResponse

```typescript
interface TenantResponse {
  id: string // UUID
  name: string
  slug: string
  plan: string
  is_active: boolean
  description: string | null
}
```

```python
class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    plan: str
    is_active: bool
    description: str | None
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";
const token = localStorage.getItem("token");

async function createTenant(data: TenantCreate): Promise<TenantResponse> {
  const res = await fetch(`${API_BASE}/api/v1/tenants/`, {
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

// Uso
const tenant = await createTenant({
  name: "Acme Corp",
  slug: "acme-corp",
  plan: "pro",
});
```

## Ejemplo completo: Python

```python
import httpx
from uuid import UUID
from pydantic import BaseModel

API_BASE = "https://api.tudominio.com"
TOKEN = "..."

class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"
    description: str | None = None

async def create_tenant(data: TenantCreate) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/tenants/",
            json=data.model_dump(exclude_none=True),
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        res.raise_for_status()
        return res.json()
```

## Errores comunes

- `409 Conflict` — Slug duplicado.
- `404 Not Found` — Tenant ID no existe.

## Patrones recomendados

- **Slug único:** Usa el slug como identificador legible en URLs públicas.
- **Plan por defecto:** Si no especificas `plan`, se crea como `"free"`.
