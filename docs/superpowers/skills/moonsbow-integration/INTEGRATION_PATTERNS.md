# Moonsbow Core — Integration Patterns

<!-- Last synced with backend: 2026-06-03 -->
<!-- Source files: backend/modules/*/router.py, backend/modules/*/schemas.py, backend/core/security/*.py, backend/core/events/dispatcher.py -->

This file contains end-to-end integration patterns. Read `SKILL.md` first for auth modes, base URLs, and the shared HTTP client.

---

## Pattern 1: Add Authentication to Your App

**Goal:** Let users register and log in through Moonsbow instead of building your own auth.

**Flow:**
1. Your frontend calls `POST /api/v1/auth/register` or `POST /api/v1/auth/login`
2. Store the returned `access_token` securely
3. Call `GET /api/v1/auth/me` to get the current user on page load
4. Send `Authorization: Bearer <token>` with every authenticated request

**TypeScript — Complete Auth Hook:**

```typescript
const API_BASE = "https://api.tudominio.com";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(localStorage.getItem("mb_token"));
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setUser)
      .catch(() => { setToken(null); localStorage.removeItem("mb_token"); });
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const { access_token } = await res.json();
    localStorage.setItem("mb_token", access_token);
    setToken(access_token);
  };

  const register = async (data: RegisterRequest) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Registration failed");
    const { access_token } = await res.json();
    localStorage.setItem("mb_token", access_token);
    setToken(access_token);
  };

  const logout = () => {
    localStorage.removeItem("mb_token");
    setToken(null);
    setUser(null);
  };

  return { token, user, login, register, logout };
}
```

**Python — FastAPI Dependency:**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

API_BASE = "https://api.tudominio.com"
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{API_BASE}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {credentials.credentials}"}
        )
    if res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return res.json()

# Usage:
@app.get("/profile")
async def profile(user: dict = Depends(get_current_user)):
    return {"email": user["email"]}
```

**Critical rules:**
- Never store the user's password. Only store the JWT.
- On `401` from `/me`, clear the token and redirect to login.
- Token expiry is 30 minutes; for long sessions implement refresh logic or re-login.

---

## Pattern 2: Register Your App and Receive Webhooks

**Goal:** Your backend service needs to receive real-time events from Moonsbow (e.g., when a user is created or a subscription changes).

**Flow:**
1. **Dashboard admin** creates the app: `POST /api/v1/apps/` (JWT auth)
2. Save the returned `api_key` and `id` securely
3. Your backend creates webhook subscriptions: `POST /api/v1/webhooks/` (API Key auth)
4. Implement a public `POST /webhooks` endpoint in your service
5. Verify `X-Webhook-Signature` on every incoming request

**Step 1 — Create App (one-time, via dashboard or admin script):**

```typescript
const app = await client.createApp({
  name: "My Service",
  slug: "my-service",
  webhook_url: "https://my-service.com/webhooks",
});
// Save: app.id, app.api_key
```

**Step 2 — Subscribe to Events (from your backend):**

```typescript
const webhookClient = new MoonsbowClient(API_BASE, undefined, app.api_key);

const sub = await webhookClient.createWebhook({
  event_types: ["user.created", "subscription.updated", "subscription.cancelled"],
  url: "https://my-service.com/webhooks",
});
// Save: sub.secret (needed for verification)
```

**Step 3 — Webhook Handler (FastAPI/Python):**

```python
import hmac
import hashlib
from fastapi import FastAPI, Request, Header, HTTPException

app = FastAPI()
WEBHOOK_SECRET = "..."  # sub.secret from step 2

@app.post("/webhooks")
async def receive_webhook(
    request: Request,
    x_webhook_signature: str = Header(...)
):
    payload = await request.body()
    expected = hmac.new(WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_webhook_signature.removeprefix("sha256=")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()

    # Deduplicate
    event_id = event["event_id"]
    if await is_processed(event_id):
        return {"status": "duplicate"}

    # Process asynchronously
    match event["event_type"]:
        case "user.created":
            await handle_user_created(event["data"])
        case "subscription.updated":
            await handle_subscription_updated(event["data"])
        case "subscription.cancelled":
            await handle_subscription_cancelled(event["data"])

    await mark_processed(event_id)
    return {"status": "ok"}
```

**Step 3 — Webhook Handler (Express/TypeScript):**

```typescript
import express from "express";
import { createHmac } from "crypto";

const WEBHOOK_SECRET = "..."; // sub.secret from step 2
const processed = new Set<string>();

app.post("/webhooks", express.raw({ type: "application/json" }), (req, res) => {
  const signature = (req.headers["x-webhook-signature"] as string)?.replace("sha256=", "");
  const payload = req.body as Buffer;

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  if (expected !== signature) return res.status(401).send("Invalid signature");

  const event = JSON.parse(payload.toString());
  if (processed.has(event.event_id)) return res.json({ status: "duplicate" });

  // Queue for async processing
  eventQueue.push(event);
  processed.add(event.event_id);
  res.json({ status: "ok" });
});
```

**Critical rules:**
- Always verify the HMAC signature. Reject requests without valid signatures.
- Respond with `200` immediately. Do not perform slow work in the HTTP handler.
- Use `event_id` for idempotency. Moonsbow retries with backoff (60s, 300s, 900s, 3600s).
- Store `api_key` in environment variables, never in source code.

---

## Pattern 3: Subscription and Billing Flow

**Goal:** Create tenants, assign subscriptions, and check plan entitlements.

**Flow:**
1. Create a tenant: `POST /api/v1/tenants/`
2. Create a subscription for that tenant: `POST /api/v1/billing/subscriptions`
3. Query tenant subscriptions to enforce plan limits

**TypeScript:**

```typescript
async function provisionTenant(name: string, slug: string, plan: string) {
  const tenant = await client.createTenant({ name, slug, plan });
  const subscription = await client.createSubscription({
    tenant_id: tenant.id,
    plan,
    status: "active",
    started_at: new Date().toISOString(),
  });
  return { tenant, subscription };
}

async function getTenantPlan(tenantId: string): Promise<string> {
  const subs = await client.request<SubscriptionResponse[]>(`/api/v1/billing/tenants/${tenantId}/subscriptions`);
  const active = subs.find(s => s.status === "active");
  return active?.plan || "free";
}
```

**Python:**

```python
async def provision_tenant(name: str, slug: str, plan: str = "free"):
    tenant = await client.create_tenant({"name": name, "slug": slug, "plan": plan})
    subscription = await client.create_subscription({
        "tenant_id": tenant["id"],
        "plan": plan,
        "status": "active",
        "started_at": datetime.utcnow().isoformat() + "Z",
    })
    return tenant, subscription

async def get_tenant_plan(tenant_id: str) -> str:
    subs = await client.request("GET", f"/api/v1/billing/tenants/{tenant_id}/subscriptions")
    active = next((s for s in subs if s["status"] == "active"), None)
    return active["plan"] if active else "free"
```

**Enforcing plan limits:**

```typescript
async function checkFeatureAccess(tenantId: string, feature: string): Promise<boolean> {
  const plan = await getTenantPlan(tenantId);
  const limits: Record<string, string[]> = {
    free: ["basic"],
    pro: ["basic", "advanced", "analytics"],
    enterprise: ["basic", "advanced", "analytics", "sso", "priority_support"],
  };
  return limits[plan]?.includes(feature) ?? false;
}
```

**Critical rules:**
- Always use `tenant_id` when creating billing resources.
- Use `external_id` when integrating with Stripe/Paddle to prevent duplicates.
- Cache tenant plan lookups for a few minutes to reduce API calls.

---

## Pattern 4: Send Notifications to Users

**Goal:** Notify users via email, SMS, or push through Moonsbow.

**Flow:**
1. Authenticate with JWT
2. `POST /api/v1/notifications/` with `tenant_id`, optional `user_id`, `type`, `content`
3. Optionally mark as read via `PATCH /api/v1/notifications/{id}/read`

**TypeScript:**

```typescript
async function notifyUser(
  tenantId: string,
  userId: string | undefined,
  type: "email" | "sms" | "push",
  content: string,
  subject?: string
): Promise<NotificationResponse> {
  return client.request<NotificationResponse>("/api/v1/notifications/", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, user_id: userId, type, content, subject }),
  });
}

// Usage
await notifyUser(tenant.id, user.id, "email", "Welcome to Moonsbow!", "Welcome");
```

**Python:**

```python
async def notify_user(tenant_id: str, user_id: str | None, type_: str, content: str, subject: str | None = None):
    return await client.request("POST", "/api/v1/notifications/", json={
        "tenant_id": tenant_id,
        "user_id": user_id,
        "type": type_,
        "content": content,
        "subject": subject,
    })
```

**Listing unread notifications:**

```typescript
async function getUnreadNotifications(userId: string, tenantId: string): Promise<NotificationResponse[]> {
  const all = await client.request<NotificationResponse[]>(
    `/api/v1/notifications/user/${userId}/tenant/${tenantId}?page=1&size=50`
  );
  return all.filter(n => !n.is_read);
}
```

**Critical rules:**
- `subject` is optional but recommended for `email` type.
- Always include `tenant_id` for multi-tenant scoping.
- Call `PATCH /read` only when the user actually views the notification.

---

## Pattern 5: Publish Custom Events

**Goal:** Your service emits events that other services (or Moonsbow webhooks) can consume.

**Flow:**
1. `POST /api/v1/events/` with `tenant_id`, `event_type`, `source`, and `payload`
2. Moonsbow stores the event and triggers webhook delivery for active subscriptions

**TypeScript:**

```typescript
async function emitEvent(
  tenantId: string,
  eventType: string,
  payload: Record<string, any>,
  source: string = "my-service"
): Promise<EventResponse> {
  return client.request<EventResponse>("/api/v1/events/", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, event_type: eventType, source, payload }),
  });
}

// Usage
await emitEvent(tenantId, "invoice.paid", { amount: 9900, currency: "usd" }, "billing-worker");
```

**Python:**

```python
async def emit_event(tenant_id: str, event_type: str, payload: dict, source: str = "my-service"):
    return await client.request("POST", "/api/v1/events/", json={
        "tenant_id": tenant_id,
        "event_type": event_type,
        "source": source,
        "payload": payload,
    })
```

**Critical rules:**
- Use a consistent `source` identifier per service for traceability.
- Document the expected `payload` shape for each `event_type` internally.
- Events published here can trigger webhooks if apps are subscribed to the event type.

---

## Pattern 6: Full Service Bootstrap

**Goal:** A new backend service needs auth, billing, webhooks, and notifications all at once.

**Recommended bootstrap sequence:**

1. **Admin creates app** (JWT) → obtains `api_key`
2. **Service subscribes to webhooks** (API Key) → obtains `secret`
3. **Service exposes** `POST /webhooks` with HMAC verification
4. **On `user.created` webhook** → create local user record
5. **On first user action** → create tenant via `POST /api/v1/tenants/`
6. **On tenant creation** → create subscription via `POST /api/v1/billing/subscriptions`
7. **Throughout** → emit events and send notifications as needed

**Environment variables your service needs:**

```bash
MOONSBOW_BASE_URL=https://api.tudominio.com
MOONSBOW_API_KEY=mb_xxxxxxxxxxxxxxxx  # from app registration
WEBHOOK_SECRET=xxxxxxxxxxxxxxxx       # from webhook subscription
```

**Health check endpoint:**

```typescript
app.get("/health", async (_req, res) => {
  try {
    await fetch(`${MOONSBOW_BASE_URL}/api/v1/health`);
    res.json({ status: "ok", moonsbow: "reachable" });
  } catch {
    res.status(503).json({ status: "degraded", moonsbow: "unreachable" });
  }
});
```

---

## Common Mistakes

| Mistake | Why It Breaks | Fix |
|---------|---------------|-----|
| Sending JWT to webhook endpoints | Webhooks require `X-API-Key`, not Bearer | Use API Key client for webhooks |
| Hardcoding API keys in repos | Security risk | Use env vars or secret managers |
| Not verifying webhook signatures | Accepts forged requests | Always verify HMAC-SHA256 |
| Ignoring `event_id` | Duplicate processing | Deduplicate webhooks by `event_id` |
| Forgetting `tenant_id` | Resource isolation fails | Include `tenant_id` in all business requests |
| Blocking webhook handlers | Timeouts and retries | Return 200 immediately, process async |
| Using `api_key` for user routes | 401 errors | JWT for user endpoints, API Key only for webhooks |
