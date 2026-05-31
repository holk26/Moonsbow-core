# Todo App — Ejemplo de Integración con Moonsbow Core

Esta es una aplicación React + Vite de ejemplo que demuestra cómo integrarse con **Moonsbow Core** usando autenticación JWT.

## Funcionalidades

- **Registro de usuario** vía `POST /api/v1/auth/register`
- **Inicio de sesión** vía `POST /api/v1/auth/login`
- **Obtener usuario actual** vía `GET /api/v1/auth/me`
- **Manejo de sesión** con `localStorage` (guarda el JWT)
- **Todo list** local (persistido en `localStorage`)
- **Cierre de sesión** limpia token y datos locales

## Estructura del cliente API

```
src/lib/api.ts       # Cliente HTTP que habla con Moonsbow
src/components/
  Login.tsx          # Formulario de login
  Register.tsx       # Formulario de registro
  TodoList.tsx       # Lista de tareas + user bar
```

## Cómo ejecutar

1. Asegúrate de que Moonsbow Core esté corriendo en local:
   ```bash
   docker compose up --build
   ```

2. Copia y configura el entorno:
   ```bash
   cd examples/todo-app
   cp .env.example .env
   # Edita .env si es necesario (por defecto apunta a http://api.localhost)
   ```

3. Instala dependencias y ejecuta:
   ```bash
   npm install
   npm run dev
   ```

4. Abre http://localhost:5173

## Convenciones de integración

- El token JWT se envía en header `Authorization: Bearer <token>`
- Si la API responde `401`, se elimina el token y se recarga la app
- Los errores de la API se muestran al usuario
- `fetch` nativo con `async/await`
