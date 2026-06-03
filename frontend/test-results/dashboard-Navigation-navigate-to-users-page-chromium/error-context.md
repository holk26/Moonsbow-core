# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Navigation >> navigate to users page
- Location: e2e/dashboard.spec.ts:70:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/users/
Received string:  "http://localhost:3000/login/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    3 × unexpected value "http://localhost:3000/"
    - waiting for" http://localhost:3000/login/" navigation to finish...
    - navigated to "http://localhost:3000/login/"
    10 × unexpected value "http://localhost:3000/login/"

```

```yaml
- text: Moonsbow Admin Panel de administración de la plataforma Email
- textbox "Email":
  - /placeholder: admin@moonsbow.com
- text: Contraseña
- textbox "Contraseña":
  - /placeholder: ••••••••
- button "Iniciar sesión"
- paragraph: Acceso restringido a administradores autorizados.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const DEV_EMAIL = "dev@moonsbow.com";
  4   | const DEV_PASSWORD = "dev123";
  5   | 
  6   | async function login(page: any) {
  7   |   await page.goto("/login");
  8   |   await page.fill('input[type="email"]', DEV_EMAIL);
  9   |   await page.fill('input[type="password"]', DEV_PASSWORD);
  10  |   await page.click('button[type="submit"]');
  11  |   await page.waitForURL("/");
  12  | }
  13  | 
  14  | test.describe("Auth", () => {
  15  |   test("login with dev user redirects to dashboard", async ({ page }) => {
  16  |     await login(page);
  17  |     await expect(page).toHaveURL("/");
  18  |     await expect(page.locator("text=Bienvenido")).toBeVisible();
  19  |   });
  20  | 
  21  |   test("logout redirects to login", async ({ page }) => {
  22  |     await login(page);
  23  |     await page.click("text=Cerrar sesión");
  24  |     await expect(page).toHaveURL("/login");
  25  |   });
  26  | });
  27  | 
  28  | test.describe("Dashboard", () => {
  29  |   test.beforeEach(async ({ page }) => {
  30  |     await login(page);
  31  |   });
  32  | 
  33  |   test("dashboard shows stats cards", async ({ page }) => {
  34  |     await expect(page.locator("text=Tenants")).toBeVisible();
  35  |     await expect(page.locator("text=Usuarios")).toBeVisible();
  36  |     await expect(page.locator("text=Apps")).toBeVisible();
  37  |     await expect(page.locator("text=Suscripciones")).toBeVisible();
  38  |   });
  39  | 
  40  |   test("dashboard shows modules section", async ({ page }) => {
  41  |     await expect(page.locator("text=Módulos activos")).toBeVisible();
  42  |     await expect(page.locator("text=Auth")).toBeVisible();
  43  |     await expect(page.locator("text=Billing")).toBeVisible();
  44  |   });
  45  | });
  46  | 
  47  | test.describe("Navigation", () => {
  48  |   test.beforeEach(async ({ page }) => {
  49  |     await login(page);
  50  |   });
  51  | 
  52  |   test("navigate to tenants page", async ({ page }) => {
  53  |     await page.click("text=Tenants");
  54  |     await expect(page).toHaveURL(/\/tenants/);
  55  |     await expect(page.locator("text=Gestiona las organizaciones")).toBeVisible();
  56  |   });
  57  | 
  58  |   test("navigate to apps page", async ({ page }) => {
  59  |     await page.click("text=Aplicaciones");
  60  |     await expect(page).toHaveURL(/\/apps/);
  61  |     await expect(page.locator("text=Nueva App")).toBeVisible();
  62  |   });
  63  | 
  64  |   test("navigate to billing page", async ({ page }) => {
  65  |     await page.click("text=Billing");
  66  |     await expect(page).toHaveURL(/\/billing/);
  67  |     await expect(page.locator("text=Gestiona las suscripciones")).toBeVisible();
  68  |   });
  69  | 
  70  |   test("navigate to users page", async ({ page }) => {
  71  |     await page.click("text=Usuarios");
> 72  |     await expect(page).toHaveURL(/\/users/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  73  |     await expect(page.locator("text=Gestión de usuarios")).toBeVisible();
  74  |   });
  75  | 
  76  |   test("navigate to events page", async ({ page }) => {
  77  |     await page.click("text=Eventos");
  78  |     await expect(page).toHaveURL(/\/events/);
  79  |     await expect(page.locator("text=Log de eventos")).toBeVisible();
  80  |   });
  81  | 
  82  |   test("navigate to notifications page", async ({ page }) => {
  83  |     await page.click("text=Notificaciones");
  84  |     await expect(page).toHaveURL(/\/notifications/);
  85  |     await expect(page.locator("text=Centro de notificaciones")).toBeVisible();
  86  |   });
  87  | });
  88  | 
  89  | test.describe("Tenants CRUD", () => {
  90  |   test.beforeEach(async ({ page }) => {
  91  |     await login(page);
  92  |     await page.click("text=Tenants");
  93  |   });
  94  | 
  95  |   test("create tenant flow", async ({ page }) => {
  96  |     await page.click("text=Nuevo Tenant");
  97  |     await page.fill('input[id="name"]', "E2E Test Tenant");
  98  |     await page.fill('input[id="slug"]', `e2e-tenant-${Date.now()}`);
  99  |     await page.fill('input[id="plan"]', "pro");
  100 |     await page.click('button:has-text("Crear tenant")');
  101 |     await expect(page.locator("text=Tenant creado correctamente")).toBeVisible();
  102 |   });
  103 | });
  104 | 
  105 | test.describe("Apps CRUD", () => {
  106 |   test.beforeEach(async ({ page }) => {
  107 |     await login(page);
  108 |     await page.click("text=Aplicaciones");
  109 |   });
  110 | 
  111 |   test("create app flow", async ({ page }) => {
  112 |     await page.click("text=Nueva App");
  113 |     await page.fill('input[id="name"]', "E2E Test App");
  114 |     await page.fill('input[id="slug"]', `e2e-app-${Date.now()}`);
  115 |     await page.click('button:has-text("Crear")');
  116 |     await expect(page.locator("text=App creada correctamente")).toBeVisible();
  117 |   });
  118 | });
  119 | 
```