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
  start_date: string;
  end_date: string | null;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface EventResponse {
  id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CourseResponse {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  is_active: boolean;
}

export interface MenuItemResponse {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
}

export interface OrderResponse {
  id: string;
  tenant_id: string;
  items: Array<{ item_id: string; quantity: number }>;
  total: number;
  status: string;
  created_at: string;
}

export interface TransactionResponse {
  id: string;
  tenant_id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
