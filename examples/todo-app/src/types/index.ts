export interface User {
  id: string
  email: string
  full_name: string | null
  tenant_id: string | null
  is_active: boolean
  is_superuser: boolean
}

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
