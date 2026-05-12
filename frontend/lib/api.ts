const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://core.app.moonsbow.com";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
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
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    fetchApi<{ access_token: string; token_type: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; full_name?: string }) =>
    fetchApi<{ id: string; email: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<{ id: string; email: string; full_name: string | null; is_active: boolean; is_superuser: boolean }>("/api/v1/auth/me"),

  // Tenants
  listTenants: (page = 1, size = 20) =>
    fetchApi<{ items: Array<Record<string, unknown>>; total: number }>(`/api/v1/tenants?page=${page}&size=${size}`),

  createTenant: (data: Record<string, unknown>) =>
    fetchApi<Record<string, unknown>>("/api/v1/tenants", { method: "POST", body: JSON.stringify(data) }),

  updateTenant: (id: string, data: Record<string, unknown>) =>
    fetchApi<Record<string, unknown>>(`/api/v1/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTenant: (id: string) =>
    fetchApi<undefined>(`/api/v1/tenants/${id}`, { method: "DELETE" }),

  // Billing
  getSubscriptions: (tenantId: string) =>
    fetchApi<Array<{ id: string; tenant_id: string; plan: string; status: string; start_date: string; end_date: string | null }>>(`/api/v1/billing/tenants/${tenantId}/subscriptions`),

  // Notifications
  listNotifications: (userId: string, tenantId: string, page = 1, size = 20) =>
    fetchApi<{ items: Array<Record<string, unknown>>; total: number }>(
      `/api/v1/notifications/user/${userId}/tenant/${tenantId}?page=${page}&size=${size}`
    ),

  markNotificationRead: (id: string) =>
    fetchApi<Record<string, unknown>>(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),

  // Events
  listEvents: (tenantId: string, page = 1, size = 20) =>
    fetchApi<{ items: Array<Record<string, unknown>>; total: number }>(
      `/api/v1/events/tenant/${tenantId}?page=${page}&size=${size}`
    ),

  // Plugins
  listCourses: (tenantId: string, page = 1, size = 20) =>
    fetchApi<{ items: Array<Record<string, unknown>>; total: number }>(
      `/api/v1/lms/tenant/${tenantId}/courses?page=${page}&size=${size}`
    ),

  listMenu: (tenantId: string, page = 1, size = 20) =>
    fetchApi<{ items: Array<Record<string, unknown>>; total: number }>(
      `/api/v1/restaurant/tenant/${tenantId}/menu?page=${page}&size=${size}`
    ),

  listTransactions: (tenantId: string, page = 1, size = 20) =>
    fetchApi<{ items: Array<Record<string, unknown>>; total: number }>(
      `/api/v1/finance/tenant/${tenantId}/transactions?page=${page}&size=${size}`
    ),
};
