# Skill: Integración con Moonsbow Core

<!-- Source of truth: backend/api/router.py, backend/modules/*/router.py, backend/modules/*/schemas.py -->
<!-- Last synced with backend: 2026-05-31 -->

## Qué es Moonsbow Core

Moonsbow Core es un toolkit SaaS centralizado que provee autenticación, facturación (billing), webhooks y notificaciones a otras aplicaciones dentro de la misma organización.

Cada app que consume Moonsbow se registra como una `App` y recibe una `API Key` para autenticación service-to-service.

## Base URL y versionado

- Base URL: configurable (`NEXT_PUBLIC_API_URL` en frontend, variable de entorno en backend)
- Prefijo de API: `/api/v1`
- Ejemplo: `https://api.tudominio.com/api/v1/auth/login`

## Modos de autenticación

### 1. JWT Bearer (usuarios humanos)

Usado por el dashboard y aplicaciones que actúan en nombre de un usuario.

- Obtén el token vía `POST /api/v1/auth/login`
- Envíalo en header: `Authorization: Bearer <access_token>`
- El token expira después de `ACCESS_TOKEN_EXPIRE_MINUTES` (por defecto 30 minutos)

### 2. API Key (apps / service-to-service)

Usado por aplicaciones registradas para consumir la API de forma autónoma.

- Registra la app vía `POST /api/v1/apps/` (requiere JWT de un usuario)
- La respuesta incluye `api_key`
- Envíala en header: `X-API-Key: <api_key>`
- Rota la key vía `POST /api/v1/apps/{id}/rotate-key` si es necesario

## Convenciones de la API

- Todos los endpoints devuelven JSON.
- IDs son UUID v4 (strings en JSON).
- Timestamps en formato ISO 8601.
- Paginación vía query params `page` y `size` (por defecto `page=1`, `size=20`).
- Respuestas de lista: array JSON directo (`[{}, {}]`), no envuelto en objeto.

## Convenciones de código

### JavaScript / TypeScript

- Usar `fetch` nativo o `axios`. Priorizar `fetch` para evitar dependencias.
- Siempre `async/await`.
- Tipar request/response con interfaces TypeScript.
- Manejar `401` redirigiendo a login o limpiando el token.
- Guardar token en `localStorage` (frontend) o variable de entorno (Node.js).

```typescript
interface ApiClientOptions {
  baseUrl: string
  token?: string
  apiKey?: string
}
```

### Python

- Usar `httpx.AsyncClient` (preferido) o `requests`.
- Usar `pydantic.BaseModel` para validar respuestas.
- Async-first: todas las funciones de red deben ser `async def`.
- Guardar token en variable de entorno o archivo de configuración.

```python
from pydantic import BaseModel
import httpx

class MoonsbowClient:
    def __init__(self, base_url: str, token: str | None = None, api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.api_key = api_key
```

## Estructura de errores

| Status | Cuándo ocurre | Qué hacer |
|--------|---------------|-----------|
| `401 Unauthorized` | Token expirado, inválido, o API key incorrecta | Refrescar token o re-autenticar |
| `403 Forbidden` | App inactiva o usuario sin permisos | Revisar estado de la app/permisos |
| `409 Conflict` | Email duplicado en registro | Mostrar error al usuario |
| `422 Validation Error` | Campos inválidos o faltantes | Mostrar errores de validación por campo |
| `404 Not Found` | Recurso no existe | Verificar UUID y existencia del recurso |

## Índice de módulos

| Módulo | Qué resuelve | Auth requerida |
|--------|--------------|----------------|
| [auth](./auth.md) | Registro, login y sesión de usuarios | Pública (register/login), JWT (me) |
| [apps](./apps.md) | Registrar apps y obtener API Keys | JWT |
| [webhooks](./webhooks.md) | Suscribirse a eventos y recibir webhooks | API Key |
| [billing](./billing.md) | Crear y gestionar suscripciones | JWT |
| [tenants](./tenants.md) | Organizaciones/tenants multi-usuario | JWT |
| [events](./events.md) | Publicar y consultar eventos de plataforma | JWT |
| [notifications](./notifications.md) | Enviar y listar notificaciones | JWT |

## Patrón base: cliente HTTP

### TypeScript

```typescript
class MoonsbowClient {
  constructor(
    private baseUrl: string,
    private token?: string,
    private apiKey?: string
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    if (this.apiKey) h["X-API-Key"] = this.apiKey;
    return h;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers(), ...(options.headers as Record<string, string> || {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
}
```

### Python

```python
import httpx
from typing import Any

class MoonsbowClient:
    def __init__(self, base_url: str, token: str | None = None, api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.api_key = api_key

    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        if self.api_key:
            h["X-API-Key"] = self.api_key
        return h

    async def request(self, method: str, path: str, **kwargs: Any) -> Any:
        async with httpx.AsyncClient() as client:
            res = await client.request(
                method,
                f"{self.base_url}{path}",
                headers={**self._headers(), **kwargs.pop("headers", {})},
                **kwargs,
            )
            res.raise_for_status()
            if res.status_code == 204:
                return None
            return res.json()
```
