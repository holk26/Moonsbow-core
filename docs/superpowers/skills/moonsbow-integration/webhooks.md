# Módulo: Webhooks

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/webhooks/router.py, backend/modules/webhooks/schemas.py, backend/core/events/dispatcher.py -->

## Descripción

Sistema de suscripción a eventos. Una app registrada puede crear webhooks para recibir notificaciones push cuando ocurren eventos como `user.created` o `subscription.updated`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/webhooks/` | API Key (`X-API-Key`) | Crear suscripción a webhook |
| `GET` | `/api/v1/webhooks/` | API Key | Listar suscripciones de la app |
| `GET` | `/api/v1/webhooks/{id}` | API Key | Obtener suscripción |
| `DELETE` | `/api/v1/webhooks/{id}` | API Key | Eliminar suscripción |

## Schemas

### Request: WebhookCreate

```typescript
interface WebhookCreate {
  event_types: string[] // ej: ["user.created", "subscription.updated"]
  url: string
}
```

```python
class WebhookCreate(BaseModel):
    event_types: list[str]
    url: str
```

### Response: WebhookResponse

```typescript
interface WebhookResponse {
  id: string // UUID
  app_id: string // UUID
  event_types: string[]
  url: string
  secret: string // para verificar firma HMAC
  is_active: boolean
}
```

```python
class WebhookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    app_id: UUID
    event_types: list[str]
    url: str
    secret: str
    is_active: bool
```

## Verificación de firma (HMAC-SHA256)

Cuando Moonsbow envía un webhook, firma el payload con `HMAC-SHA256` usando el `secret` de la suscripción. El header es `X-Webhook-Signature`.

### TypeScript

```typescript
import { createHmac } from "crypto";

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

// En tu handler de Express/Fastify/etc:
app.post("/webhooks", (req, res) => {
  const signature = req.headers["x-webhook-signature"] as string;
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET!;

  if (!verifyWebhook(payload, signature, secret)) {
    return res.status(401).send("Firma inválida");
  }

  const event = req.body;
  console.log("Evento recibido:", event.event_type);
  res.status(200).send("OK");
});
```

### Python

```python
import hmac
import hashlib

async def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

# En tu handler de FastAPI:
from fastapi import Request, Header, HTTPException

@app.post("/webhooks")
async def receive_webhook(
    request: Request,
    x_webhook_signature: str = Header(...),
):
    payload = await request.body()
    secret = "..."  # WebhookResponse.secret
    if not await verify_webhook(payload, x_webhook_signature, secret):
        raise HTTPException(status_code=401, detail="Firma inválida")
    event = await request.json()
    print("Evento recibido:", event["event_type"])
    return {"status": "ok"}
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";
const API_KEY = "..."; // de tu App

async function createWebhook(data: WebhookCreate): Promise<WebhookResponse> {
  const res = await fetch(`${API_BASE}/api/v1/webhooks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Uso
const sub = await createWebhook({
  event_types: ["user.created", "subscription.updated"],
  url: "https://miservicio.com/webhooks",
});
console.log("Webhook secret:", sub.secret);
```

## Ejemplo completo: Python

```python
import httpx
from pydantic import BaseModel

API_BASE = "https://api.tudominio.com"
API_KEY = "..."

class WebhookCreate(BaseModel):
    event_types: list[str]
    url: str

async def create_webhook(data: WebhookCreate) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/webhooks/",
            json=data.model_dump(),
            headers={"X-API-Key": API_KEY},
        )
        res.raise_for_status()
        return res.json()
```

## Errores comunes

- `401 Unauthorized` — API Key inválida o app inactiva.
- `403 Forbidden` — App desactivada.

## Patrones recomendados

- **Verificar siempre la firma:** Nunca proceses un webhook sin validar `X-Webhook-Signature`.
- **Responder rápido:** Devuelve `200 OK` inmediatamente y procesa el evento en background.
- **Idempotencia:** Los webhooks pueden duplicarse. Usa el `event.id` para deduplicar.
- **Eventos comunes:** `user.created`, `subscription.updated`, `subscription.cancelled`.
