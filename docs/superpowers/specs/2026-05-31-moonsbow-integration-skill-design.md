# Design Doc: Skill de Integración Moonsbow Core

**Fecha:** 2026-05-31  
**Autor:** AI Agent (brainstorming session)  
**Estado:** Aprobado por usuario  
**Enfoque:** B — Skill modular documentado

---

## 1. Resumen

Crear un skill de Kimi Code llamado `moonsbow-integration` que enseñe a los agentes a generar código de integración con la API de Moonsbow Core. El skill cubrirá JavaScript/TypeScript y Python, con ejemplos listos para usar por módulo.

El skill vivirá dentro del repositorio en `docs/superpowers/skills/moonsbow-integration/` para que esté versionado con el código y cualquier contribuidor pueda actualizarlo cuando la API cambie.

---

## 2. Arquitectura y Estructura de Archivos

```
docs/superpowers/skills/moonsbow-integration/
├── SKILL.md          # Entry point: convenciones comunes, autenticación, estructura base
├── auth.md           # Patrones de autenticación (JWT para usuarios, API Key para apps)
├── apps.md           # Registro de apps y rotación de API keys
├── webhooks.md       # Recibir y verificar webhooks (HMAC-SHA256)
├── billing.md        # Suscripciones y planes
├── tenants.md        # CRUD de organizaciones/tenants
├── events.md         # Eventos de plataforma
└── notifications.md  # Notificaciones de usuario
```

Cada archivo `.md` es independiente. Los agentes cargan `SKILL.md` primero y luego el módulo específico que necesiten.

---

## 3. SKILL.md — Entry Point y Convenciones Comunes

El archivo `SKILL.md` es la puerta de entrada obligatoria. Todo agente que necesite generar código de integración con Moonsbow debe leerlo primero.

### 3.1 Identidad de la plataforma
- Moonsbow Core es un toolkit SaaS centralizado que provee auth, billing, webhooks y notificaciones.
- Base URL: configurable (`NEXT_PUBLIC_API_URL` en frontend, variable de entorno en backend).
- Prefijo de API: `/api/v1`.

### 3.2 Modos de autenticación
- **JWT Bearer** (`Authorization: Bearer <token>`): para usuarios humanos (dashboard). Se obtiene vía `POST /api/v1/auth/login`.
- **API Key** (`X-API-Key: <api_key>`): para apps registradas (service-to-service). Se obtiene al crear una app vía `POST /api/v1/apps/` (requiere JWT).

### 3.3 Convenciones de la API
- Todos los endpoints devuelven JSON.
- IDs son UUID v4.
- Timestamps en ISO 8601.
- Paginación: query params `page` y `size` (por defecto `page=1`, `size=20`).
- Respuestas de lista: array directo (no envuelto en objeto `{ items: [] }`).

### 3.4 Convenciones de código
- **JS/TS:** Usar `fetch` nativo o `axios`. Siempre `async/await`. Tipar request/response con interfaces TypeScript. Manejar 401 redirigiendo a login.
- **Python:** Usar `httpx.AsyncClient` (preferido) o `requests`. Usar `pydantic.BaseModel` para validar respuestas. Async-first.

### 3.5 Estructura de errores
- `401 Unauthorized`: token expirado o API key inválida.
- `403 Forbidden`: app inactiva o sin permisos.
- `409 Conflict`: email duplicado en registro.
- `422 Validation Error`: FastAPI auto-generado.

### 3.6 Índice de módulos
Tabla con cada módulo y qué problema resuelve, para que el agente sepa qué archivo leer a continuación.

---

## 4. Contenido de los Módulos

Cada archivo de módulo sigue esta plantilla:

```markdown
# Módulo: <Nombre>

## Descripción
Qué hace este módulo en Moonsbow Core.

## Endpoints
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|

## Schemas
### Request: <Nombre>
```typescript
// TypeScript interface
```
```python
# Python dataclass/Pydantic
```

### Response: <Nombre>
...

## Ejemplo completo: JS/TS
```typescript
// Código funcional listo para usar
```

## Ejemplo completo: Python
```python
# Código funcional listo para usar
```

## Errores comunes
- 401 cuando...
- 409 cuando...

## Patrones recomendados
- Guardar el token en localStorage / env var
- Refrescar / reintentar en 401
```

### 4.1 auth.md
- `POST /api/v1/auth/register` → crea usuario (público, no requiere auth)
- `POST /api/v1/auth/login` → devuelve `TokenResponse` con `access_token` (público)
- `GET /api/v1/auth/me` → devuelve `UserResponse`
- Patrón: guardar token, enviar `Authorization: Bearer`, manejar 401 redirigiendo a login.

### 4.2 apps.md
- `POST /api/v1/apps/` → registrar app (requiere JWT), devuelve `AppResponse` con `api_key`
- `GET /api/v1/apps/` → listar apps paginado (`page`, `size`)
- `GET /api/v1/apps/{id}` → detalle de app
- `PUT /api/v1/apps/{id}` → actualizar app
- `DELETE /api/v1/apps/{id}` → eliminar app
- `POST /api/v1/apps/{id}/rotate-key` → rotar API key
- Patrón: el `api_key` devuelto es el que se usa en header `X-API-Key` para webhooks y otras llamadas machine-to-machine.

### 4.3 webhooks.md
- `POST /api/v1/webhooks/` → crear suscripción (requiere `X-API-Key`)
- `GET /api/v1/webhooks/` → listar suscripciones de la app
- `GET /api/v1/webhooks/{id}` → detalle de suscripción
- `DELETE /api/v1/webhooks/{id}` → eliminar suscripción
- **Verificación de webhooks:** El payload se firma con HMAC-SHA256 usando el `secret` de la suscripción (`WebhookResponse.secret`). Documentar cómo verificar la firma en JS/TS y Python.
- Eventos soportados: `user.created`, `subscription.updated`, etc.

### 4.4 billing.md
- `POST /api/v1/billing/subscriptions` → crear suscripción
- `GET /api/v1/billing/subscriptions/{id}` → detalle de suscripción
- `GET /api/v1/billing/tenants/{tenant_id}/subscriptions` → suscripciones de un tenant
- `PUT /api/v1/billing/subscriptions/{id}` → actualizar (plan, status, expires_at)

### 4.5 tenants.md, events.md, notifications.md
- Estructura idéntica: endpoints, schemas TypeScript/Python, ejemplos completos en ambos lenguajes, errores comunes y patrones recomendados.

---

## 5. Mantenimiento y Sincronización

### 5.1 Fuente de verdad
- Los schemas en los `.md` del skill deben reflejar **exactamente** los Pydantic models del backend (`backend/modules/*/schemas.py`).
- Los endpoints deben coincidir con los routers (`backend/modules/*/router.py`).

### 5.2 Proceso de actualización
- Cuando se modifique un schema o router en el backend, el desarrollador debe actualizar el `.md` correspondiente del skill.
- Se actualizará `AGENTS.md` para incluir una nota indicando que los cambios en la API requieren sincronizar el skill.

### 5.3 Validación visual
- Cada archivo de módulo incluirá un comentario al tope:
  ```markdown
  <!-- Last synced with backend: 2026-05-31 -->
  <!-- Source files: backend/modules/auth/router.py, backend/modules/auth/schemas.py -->
  ```
- Esto permite a cualquier agente (o humano) verificar rápidamente si el skill está desactualizado.

### 5.4 Ubicación
El skill vivirá en `docs/superpowers/skills/moonsbow-integration/` dentro del repositorio. Está versionado con git y cualquier contribuidor puede actualizarlo.

---

## 6. Criterios de Éxito

- [ ] El skill `SKILL.md` puede ser leído por un agente de Kimi Code y este genera código de integración funcional en JS/TS o Python.
- [ ] Los ejemplos de código compilan/ejecutan sin errores sintácticos.
- [ ] Los endpoints y schemas documentados coinciden con la implementación real del backend.
- [ ] `AGENTS.md` refleja la existencia del skill y el proceso de sincronización.
