# Diseño: Moonsbow Core Replanteado — SaaS Toolkit Centralizado

**Fecha:** 2026-05-30
**Estado:** Aprobado por usuario
**Enfoque seleccionado:** C — Toolkit con Eventos + Extensibilidad

---

## 1. Resumen Ejecutivo

Moonsbow Core se transforma de una plataforma monolítica multi-producto (con plugins como LMS, restaurante y finanzas) en un **servicio de infraestructura SaaS centralizado**. Su único propósito es proveer a otras aplicaciones de la misma organización las capacidades reutilizables esenciales: autenticación, gestión de aplicaciones, cobros, notificaciones y un sistema de eventos con webhooks.

Cada aplicación hija se registra como una `App` en Moonsbow Core y consume sus servicios vía API REST. Adicionalmente, pueden suscribir webhooks para recibir eventos en tiempo real.

---

## 2. Alcance

### 2.1. Lo que se conserva

| Módulo | Función | Notas |
|--------|---------|-------|
| `auth` | Registro, login, JWT, gestión de usuarios | Sin cambios funcionales |
| `tenants` | Agrupación de datos por aplicación | Se asocia a una `App` |
| `billing` | CRUD de suscripciones y planes | Básico, sin pasarela real por ahora |
| `notifications` | Envío y tracking de notificaciones | Ahora targetea `user_id` + `app_id` |
| `events` | Logging de eventos de plataforma | Se potencia con webhook delivery |

### 2.2. Lo que se elimina

- **Plugins de producto:** `lms/`, `restaurant/`, `finance/` — son responsabilidad de cada aplicación hija.
- **Tablas asociadas:** `lms_courses`, `lms_enrollments`, `restaurant_menu_items`, `restaurant_orders`, `finance_transactions`.

### 2.3. Lo que se crea

| Módulo | Función |
|--------|---------|
| `apps` | Registro y gestión de aplicaciones consumidoras |
| `webhooks` | Suscripciones y delivery de eventos vía HTTP POST |
| `api_keys` | Autenticación de servicios (máquina-a-máquina) |

---

## 3. Arquitectura

```
┌─────────────────┐     API REST      ┌──────────────────────────┐
│   App Comidas   │◄─────────────────►│                          │
│   (tu SaaS)     │                   │    Moonsbow Core         │
└─────────────────┘                   │    ┌─────────────────┐   │
        ▲                             │    │  Auth           │   │
        │ Webhooks                    │    │  Tenants        │   │
        └─────────────────────────────┤    │  Billing        │   │
                                      │    │  Notifications  │   │
┌─────────────────┐     API REST      │    │  Events         │   │
│   App Gym       │◄─────────────────►│    │  Apps           │   │
│   (tu SaaS)     │                   │    │  Webhooks       │   │
└─────────────────┘                   │    └─────────────────┘   │
        ▲                             │                          │
        │ Webhooks                    └──────────────────────────┘
        └──────────────────────────────────────────────────────────┘
```

### Flujo típico

1. Una app hija se registra en Moonsbow Core (`POST /api/v1/apps`).
2. Moonsbow genera un `api_key` único para esa app.
3. La app hija usa ese `api_key` en el header `X-API-Key` para todas sus requests.
4. Cuando ocurre un evento relevante (ej: usuario registrado), Moonsbow:
   - Guarda el evento en `platform_events`
   - Consulta `webhook_subscriptions` activas para ese `event_type`
   - Envía POST al `url` configurado, firmado con HMAC-SHA256

---

## 4. Modelos de Datos

### 4.1. Nuevos modelos

#### `App`

```python
class App(BaseModel):
    __tablename__ = "apps"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    api_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
```

#### `WebhookSubscription`

```python
class WebhookSubscription(BaseModel):
    __tablename__ = "webhook_subscriptions"

    app_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    event_types: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    secret: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
```

### 4.2. Modelos ajustados

#### `Tenant` (se mantiene, enriquecido)

```python
class Tenant(BaseModel):
    # ... campos existentes ...
    app_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
```

#### `Subscription`

```python
class Subscription(BaseModel):
    # tenant_id se mantiene
    # Se añade app_id para facilitar queries directas
    app_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
```

#### `Notification`

```python
class Notification(BaseModel):
    # ... campos existentes ...
    app_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
```

### 4.3. Modelos eliminados

- `lms.Course`
- `lms.Enrollment`
- `restaurant.MenuItem`
- `restaurant.Order`
- `finance.Transaction`

---

## 5. API REST

### 5.1. Nuevos endpoints

#### Apps (`/api/v1/apps`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/apps` | Registrar nueva app |
| GET | `/apps` | Listar apps (paginado) |
| GET | `/apps/{id}` | Obtener detalle de app |
| PUT | `/apps/{id}` | Actualizar app (nombre, webhook_url, etc.) |
| DELETE | `/apps/{id}` | Desactivar/eliminar app |
| POST | `/apps/{id}/rotate-key` | Generar nueva API key |

#### Webhooks (`/api/v1/webhooks`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/webhooks` | Crear suscripción a eventos |
| GET | `/webhooks` | Listar suscripciones de la app actual |
| GET | `/webhooks/{id}` | Detalle de suscripción |
| DELETE | `/webhooks/{id}` | Eliminar suscripción |

### 5.2. Endpoints existentes que se mantienen

- `/api/v1/auth/register`
- `/api/v1/auth/login`
- `/api/v1/auth/me`
- `/api/v1/tenants/*`
- `/api/v1/billing/*`
- `/api/v1/notifications/*`
- `/api/v1/events/*`

### 5.3. Endpoints eliminados

- `/api/v1/lms/*`
- `/api/v1/restaurant/*`
- `/api/v1/finance/*`

### 5.4. Autenticación

- **Usuarios humanos** (dashboard): JWT Bearer (`Authorization: Bearer <token>`)
- **Servicios/apps** (máquina-a-máquina): API Key (`X-API-Key: <key>`)

El middleware de API Key:
1. Lee el header `X-API-Key`
2. Busca la `App` asociada
3. Si es válida y está activa, inyecta `app` en el request state
4. Los endpoints que requieren contexto de app usan esa inyección

---

## 6. Sistema de Eventos y Webhooks

### 6.1. Eventos soportados (fase inicial)

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `user.created` | Nuevo usuario registrado | `{ user_id, email, tenant_id, app_id }` |
| `user.login` | Usuario inició sesión | `{ user_id, email, timestamp }` |
| `subscription.created` | Nueva suscripción creada | `{ subscription_id, tenant_id, app_id, plan }` |
| `subscription.updated` | Suscripción modificada | `{ subscription_id, changes, timestamp }` |
| `subscription.cancelled` | Suscripción cancelada | `{ subscription_id, tenant_id, app_id }` |
| `notification.sent` | Notificación enviada | `{ notification_id, user_id, type, subject }` |

### 6.2. Delivery de webhooks

Cuando el event dispatcher emite un evento:

1. El `WebhookService` recibe el evento
2. Consulta `webhook_subscriptions` donde:
   - `event_types` contiene el tipo del evento
   - `is_active = true`
3. Por cada suscripción encontrada:
   - Construye el payload JSON
   - Genera firma HMAC-SHA256: `X-Webhook-Signature: sha256=<hex>`
   - Envía POST al `url`
   - Si falla (status >= 400 o timeout), encola reintento con backoff exponencial (1min, 5min, 15min, 1h)
   - Máximo 4 intentos totales

### 6.3. Formato del payload

```json
{
  "event_id": "uuid-del-evento",
  "event_type": "user.created",
  "timestamp": "2026-05-30T14:00:00Z",
  "app_id": "uuid-de-la-app",
  "data": {
    "user_id": "...",
    "email": "user@example.com",
    "tenant_id": "..."
  }
}
```

---

## 7. Frontend (Next.js)

### 7.1. Cambios estructurales

- Eliminar páginas y menús de LMS, Restaurante y Finanzas
- Añadir sección **"Aplicaciones"** en el sidebar
- Añadir sección **"Webhooks"** dentro del detalle de cada app

### 7.2. Nuevas páginas

| Ruta | Contenido |
|------|-----------|
| `/apps` | Lista de apps registradas |
| `/apps/new` | Formulario para crear app |
| `/apps/[id]` | Detalle de app (nombre, slug, webhook URL, API key) |
| `/apps/[id]/webhooks` | Suscripciones de webhooks de esa app |
| `/apps/[id]/billing` | Suscripciones/billing asociadas a la app |

### 7.3. Ajustes a páginas existentes

- `/notifications` — filtrar por app seleccionada
- `/events` — mostrar app_id asociado
- `/tenants` — mostrar app_id asociado

---

## 8. Plan de Implementación (Resumen)

| Fase | Tarea | Archivos afectados |
|------|-------|-------------------|
| 1 | Eliminar plugins y sus referencias | `backend/plugins/*`, `backend/api/router.py`, frontend |
| 2 | Crear modelo `App` + migración | `backend/modules/apps/`, `migrations/` |
| 3 | Crear modelo `WebhookSubscription` + migración | `backend/modules/webhooks/`, `migrations/` |
| 4 | Ajustar `Tenant`, `Subscription`, `Notification` | Modelos y schemas existentes |
| 5 | Implementar auth por API Key | Middleware/dependency en `backend/core/security/` |
| 6 | Potenciar eventos con webhook delivery | `backend/core/events/dispatcher.py`, `WebhookService` |
| 7 | Actualizar frontend | Nuevas páginas en `frontend/app/(dashboard)/` |
| 8 | Actualizar documentación | `AGENTS.md`, `README.md` |

---

## 9. Consideraciones de Seguridad

- Las `api_key` deben almacenarse hasheadas (bcrypt) o al menos no exponerse completas en el frontend (mostrar solo prefijo, ej: `mb_live_xxxx...`)
- Los webhooks deben firmarse con HMAC-SHA256 para que las apps hijas verifiquen autenticidad
- El `secret` de webhook debe ser generado automáticamente y mostrarse solo una vez (como Stripe)
- Rotación de API keys debe ser posible sin downtime (aceptar key anterior por ventana de gracia de 24h)

---

## 10. Decisiones explícitas

| Decisión | Justificación |
|----------|---------------|
| Billing básico (sin pasarela) | El usuario indicó que por ahora es solo CRUD de suscripciones. Stripe se integra en fase posterior. |
| Tenant se mantiene | Aunque `App` es el concepto principal, `Tenant` sigue útil para que una app pueda tener múltiples tenants (ej: prod, staging). |
| Eventos in-memory + webhooks async | El dispatcher in-memory es suficiente para eventos intra-proceso. Los webhooks usan Celery para delivery async. |
| Frontend admin se conserva | El usuario quiere un dashboard para gestionar sus apps y ver métricas. |
| Solo se eliminan plugins de producto | Los módulos de plataforma (auth, billing, etc.) son el valor del toolkit. |
