export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string | null;
  tenant_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  tenant_id?: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  description: string | null;
}

export interface TenantCreate {
  name: string;
  slug: string;
  plan?: string;
  description?: string;
}

export interface TenantUpdate {
  name?: string;
  slug?: string;
  plan?: string;
  description?: string;
  is_active?: boolean;
}

export interface SubscriptionResponse {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  external_id: string | null;
}

export interface NotificationResponse {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  sent_at: string | null;
}

export interface EventResponse {
  id: string;
  tenant_id: string;
  event_type: string;
  source: string;
  payload: Record<string, unknown> | null;
  status: string;
}

export interface AppResponse {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  is_active: boolean;
  webhook_url: string | null;
  description: string | null;
}

export interface AppCreate {
  name: string;
  slug: string;
  description?: string;
  webhook_url?: string;
}

export interface AppUpdate {
  name?: string;
  description?: string;
  webhook_url?: string;
  is_active?: boolean;
}

export interface StatsResponse {
  users: number;
  tenants: number;
  apps: number;
  subscriptions: number;
  notifications: number;
  events: number;
}

export interface WebhookResponse {
  id: string;
  app_id: string;
  event_types: string[];
  url: string;
  secret: string;
  is_active: boolean;
}

export interface WebhookCreate {
  event_types: string[];
  url: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
