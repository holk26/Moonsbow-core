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
  type CourseResponse,
  type MenuItemResponse,
  type TransactionResponse,
  type PaginatedResponse,
  type AppResponse,
  type AppCreate,
  type AppUpdate,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://core.app.moonsbow.com";

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

  // Notifications
  listNotifications: (userId: string, tenantId: string, page = 1, size = 20) =>
    fetchApi<PaginatedResponse<NotificationResponse>>(
      `/api/v1/notifications/user/${userId}/tenant/${tenantId}?page=${page}&size=${size}`
    ),

  markNotificationRead: (id: string) =>
    fetchApi<NotificationResponse>(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),

  // Events
  listEvents: (tenantId: string, page = 1, size = 20) =>
    fetchApi<PaginatedResponse<EventResponse>>(
      `/api/v1/events/tenant/${tenantId}?page=${page}&size=${size}`
    ),

  // Plugins
  listCourses: (tenantId: string, page = 1, size = 20) =>
    fetchApi<PaginatedResponse<CourseResponse>>(
      `/api/v1/lms/tenant/${tenantId}/courses?page=${page}&size=${size}`
    ),

  listMenu: (tenantId: string, page = 1, size = 20) =>
    fetchApi<PaginatedResponse<MenuItemResponse>>(
      `/api/v1/restaurant/tenant/${tenantId}/menu?page=${page}&size=${size}`
    ),

  listTransactions: (tenantId: string, page = 1, size = 20) =>
    fetchApi<PaginatedResponse<TransactionResponse>>(
      `/api/v1/finance/tenant/${tenantId}/transactions?page=${page}&size=${size}`
    ),

  // Apps
  listApps: (page = 1, size = 20) =>
    fetchApi<PaginatedResponse<AppResponse>>(`/api/v1/apps?page=${page}&size=${size}`),

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
};
