import {
  type TokenResponse,
  type UserResponse,
  type LoginRequest,
  type RegisterRequest,
  type TenantResponse,
  type TenantCreate,
  type TenantUpdate,
  type SubscriptionResponse,
  type NotificationResponse,
  type EventResponse,
  type AppResponse,
  type AppCreate,
  type AppUpdate,
  type StatsResponse,
  type PaginatedResponse,
  type WebhookResponse,
  type WebhookCreate,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://core.app.moonsbow.com";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    redirect: "follow",
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(error.detail || `HTTP ${res.status}`, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export { ApiError };

async function fetchApiWithKey<T>(
  path: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    redirect: "follow",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(error.detail || `HTTP ${res.status}`, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (data: LoginRequest) =>
    fetchApi<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    fetchApi<UserResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<UserResponse>("/api/v1/auth/me"),

  listUsers: (page = 1, size = 20) =>
    fetchApi<UserResponse[]>(`/api/v1/auth/users?page=${page}&size=${size}`),

  // Stats
  getStats: () => fetchApi<StatsResponse>("/api/v1/stats/"),

  // Tenants
  listTenants: (page = 1, size = 20) =>
    fetchApi<PaginatedResponse<TenantResponse>>(`/api/v1/tenants?page=${page}&size=${size}`),

  createTenant: (data: TenantCreate) =>
    fetchApi<TenantResponse>("/api/v1/tenants", { method: "POST", body: JSON.stringify(data) }),

  updateTenant: (id: string, data: TenantUpdate) =>
    fetchApi<TenantResponse>(`/api/v1/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTenant: (id: string) =>
    fetchApi<undefined>(`/api/v1/tenants/${id}`, { method: "DELETE" }),

  // Billing
  getSubscriptions: (tenantId: string) =>
    fetchApi<SubscriptionResponse[]>(`/api/v1/billing/tenants/${tenantId}/subscriptions`),

  createSubscription: (data: { tenant_id: string; plan: string; status?: string; expires_at?: string; external_id?: string }) =>
    fetchApi<SubscriptionResponse>("/api/v1/billing/subscriptions", { method: "POST", body: JSON.stringify(data) }),

  updateSubscription: (id: string, data: { plan?: string; status?: string; expires_at?: string }) =>
    fetchApi<SubscriptionResponse>(`/api/v1/billing/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Notifications
  listNotifications: (userId: string, tenantId: string, page = 1, size = 20) =>
    fetchApi<NotificationResponse[]>(
      `/api/v1/notifications/user/${userId}/tenant/${tenantId}?page=${page}&size=${size}`
    ),

  markNotificationRead: (id: string) =>
    fetchApi<NotificationResponse>(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),

  // Events
  listEvents: (tenantId: string, page = 1, size = 20) =>
    fetchApi<EventResponse[]>(
      `/api/v1/events/tenant/${tenantId}?page=${page}&size=${size}`
    ),

  listRecentEvents: (limit = 10) =>
    fetchApi<EventResponse[]>(`/api/v1/events/recent?limit=${limit}`),

  // Apps
  listApps: (page = 1, size = 20) =>
    fetchApi<AppResponse[]>(`/api/v1/apps?page=${page}&size=${size}`),

  getApp: (id: string) =>
    fetchApi<AppResponse>(`/api/v1/apps/${id}`),

  createApp: (data: AppCreate) =>
    fetchApi<AppResponse>("/api/v1/apps", { method: "POST", body: JSON.stringify(data) }),

  updateApp: (id: string, data: AppUpdate) =>
    fetchApi<AppResponse>(`/api/v1/apps/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteApp: (id: string) =>
    fetchApi<undefined>(`/api/v1/apps/${id}`, { method: "DELETE" }),

  rotateAppKey: (id: string) =>
    fetchApi<AppResponse>(`/api/v1/apps/${id}/rotate-key`, { method: "POST" }),

  // Webhooks (API Key auth)
  listWebhooks: (apiKey: string) =>
    fetchApiWithKey<WebhookResponse[]>("/api/v1/webhooks/", apiKey),

  createWebhook: (apiKey: string, data: WebhookCreate) =>
    fetchApiWithKey<WebhookResponse>("/api/v1/webhooks/", apiKey, { method: "POST", body: JSON.stringify(data) }),

  deleteWebhook: (apiKey: string, id: string) =>
    fetchApiWithKey<undefined>(`/api/v1/webhooks/${id}`, apiKey, { method: "DELETE" }),
};
