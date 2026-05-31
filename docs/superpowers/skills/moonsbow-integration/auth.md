# Módulo: Auth

<!-- Last synced with backend: 2026-05-31 -->
<!-- Source files: backend/modules/auth/router.py, backend/modules/auth/schemas.py -->

## Descripción

Gestión de usuarios humanos en Moonsbow Core. Permite registrar nuevos usuarios, iniciar sesión y obtener la información del usuario autenticado.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | Pública | Crear un nuevo usuario |
| `POST` | `/api/v1/auth/login` | Pública | Iniciar sesión, devuelve JWT |
| `GET` | `/api/v1/auth/me` | JWT Bearer | Obtener usuario actual |

## Schemas

### Request: Register

```typescript
interface RegisterRequest {
  email: string
  password: string
  full_name?: string
  tenant_id?: string // UUID opcional
}
```

```python
from pydantic import BaseModel, EmailStr
from uuid import UUID

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    tenant_id: UUID | None = None
```

### Request: Login

```typescript
interface LoginRequest {
  email: string
  password: string
}
```

```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
```

### Response: TokenResponse

```typescript
interface TokenResponse {
  access_token: string
  token_type: string // "bearer"
}
```

```python
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

### Response: UserResponse

```typescript
interface UserResponse {
  id: string // UUID
  email: string
  full_name: string | null
  tenant_id: string | null
  is_active: boolean
  is_superuser: boolean
}
```

```python
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    full_name: str | None
    tenant_id: UUID | None
    is_active: bool
    is_superuser: bool
```

## Ejemplo completo: JS/TS

```typescript
const API_BASE = "https://api.tudominio.com";

async function register(data: RegisterRequest): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Uso
const { access_token } = await login({ email: "user@example.com", password: "secret" });
localStorage.setItem("token", access_token);
const user = await getMe(access_token);
console.log(user.email);
```

## Ejemplo completo: Python

```python
import httpx
from pydantic import BaseModel, EmailStr

API_BASE = "https://api.tudominio.com"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

async def login(data: LoginRequest) -> TokenResponse:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{API_BASE}/api/v1/auth/login",
            json=data.model_dump(),
        )
        res.raise_for_status()
        return TokenResponse(**res.json())

async def get_me(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{API_BASE}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        res.raise_for_status()
        return res.json()

# Uso
import asyncio
token = asyncio.run(login(LoginRequest(email="user@example.com", password="secret")))
print(token.access_token)
```

## Errores comunes

- `409 Conflict` — Email ya registrado. Mostrar mensaje claro al usuario.
- `401 Unauthorized` — Credenciales inválidas en login, o token expirado en `/me`.
- `422 Validation Error` — Email con formato incorrecto o password vacío.

## Patrones recomendados

- **Guardar token:** En frontend usar `localStorage` o `sessionStorage`. En backend usar variables de entorno o secret managers.
- **Manejar 401:** Si `/me` devuelve 401, eliminar el token y redirigir a login.
- **No almacenar password:** Nunca guardes la contraseña del usuario en ningún lado; solo el token JWT.
- **Token expire:** Implementa un interceptor que capture 401 y renueve o redirija.
