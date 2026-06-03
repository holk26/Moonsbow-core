# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> dashboard shows modules section
- Location: e2e/dashboard.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Billing')
Expected: visible
Error: strict mode violation: locator('text=Billing') resolved to 2 elements:
    1) <a href="/billing/" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground">…</a> aka getByRole('link', { name: 'Billing' })
    2) <span class="text-sm font-medium">Billing</span> aka getByRole('main').getByText('Billing')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Billing')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - link "Moonsbow" [ref=e6] [cursor=pointer]:
          - /url: /
          - text: Moonsbow
        - generic [ref=e9]:
          - link "Dashboard" [ref=e10] [cursor=pointer]:
            - /url: /
            - img [ref=e11]
            - text: Dashboard
          - link "Aplicaciones" [ref=e16] [cursor=pointer]:
            - /url: /apps/
            - img [ref=e17]
            - text: Aplicaciones
          - link "Tenants" [ref=e19] [cursor=pointer]:
            - /url: /tenants/
            - img [ref=e20]
            - text: Tenants
          - link "Billing" [ref=e24] [cursor=pointer]:
            - /url: /billing/
            - img [ref=e25]
            - text: Billing
          - link "Usuarios" [ref=e27] [cursor=pointer]:
            - /url: /users/
            - img [ref=e28]
            - text: Usuarios
          - link "Notificaciones" [ref=e33] [cursor=pointer]:
            - /url: /notifications/
            - img [ref=e34]
            - text: Notificaciones
          - link "Eventos" [ref=e37] [cursor=pointer]:
            - /url: /events/
            - img [ref=e38]
            - text: Eventos
        - button "Cerrar sesión" [ref=e41]:
          - img [ref=e42]
          - text: Cerrar sesión
    - generic [ref=e45]:
      - banner [ref=e46]:
        - heading "Panel de Administración" [level=1] [ref=e47]
        - generic [ref=e49]:
          - generic [ref=e50]:
            - paragraph [ref=e51]: Dev User
            - paragraph [ref=e52]: dev@moonsbow.com
          - generic [ref=e54]: DE
          - generic [ref=e55]: Admin
      - main [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]:
            - heading "Bienvenido, Dev User" [level=2] [ref=e59]
            - paragraph [ref=e60]: Panel de administración de Moonsbow Core
          - generic [ref=e61]:
            - generic [ref=e62]:
              - generic [ref=e63]:
                - generic [ref=e64]: Tenants
                - img [ref=e65]
              - paragraph [ref=e72]: Organizaciones activas
            - generic [ref=e73]:
              - generic [ref=e74]:
                - generic [ref=e75]: Usuarios
                - img [ref=e76]
              - paragraph [ref=e84]: Usuarios registrados
            - generic [ref=e85]:
              - generic [ref=e86]:
                - generic [ref=e87]: Apps
                - img [ref=e88]
              - paragraph [ref=e93]: Aplicaciones integradas
            - generic [ref=e94]:
              - generic [ref=e95]:
                - generic [ref=e96]: Suscripciones
                - img [ref=e97]
              - paragraph [ref=e102]: Planes activos
            - generic [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]: Eventos
                - img [ref=e106]
              - paragraph [ref=e111]: Eventos registrados
            - generic [ref=e112]:
              - generic [ref=e113]:
                - generic [ref=e114]: Notificaciones
                - img [ref=e115]
              - paragraph [ref=e121]: Notificaciones enviadas
          - generic [ref=e122]:
            - generic [ref=e124]:
              - generic [ref=e125]: Actividad reciente
              - generic [ref=e126]: Últimos eventos del sistema
            - generic [ref=e132]:
              - generic [ref=e133]:
                - generic [ref=e134]: Módulos activos
                - generic [ref=e135]: Servicios habilitados en la plataforma
              - generic [ref=e137]:
                - generic [ref=e138]:
                  - generic [ref=e139]: Auth
                  - generic [ref=e140]: ● Activo
                - generic [ref=e141]:
                  - generic [ref=e142]: Tenants
                  - generic [ref=e143]: ● Activo
                - generic [ref=e144]:
                  - generic [ref=e145]: Billing
                  - generic [ref=e146]: ● Activo
                - generic [ref=e147]:
                  - generic [ref=e148]: Apps
                  - generic [ref=e149]: ● Activo
                - generic [ref=e150]:
                  - generic [ref=e151]: Webhooks
                  - generic [ref=e152]: ● Activo
                - generic [ref=e153]:
                  - generic [ref=e154]: Events
                  - generic [ref=e155]: ● Activo
                - generic [ref=e156]:
                  - generic [ref=e157]: Notifications
                  - generic [ref=e158]: ● Activo
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e164] [cursor=pointer]:
    - img [ref=e165]
  - alert [ref=e168]
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
> 43  |     await expect(page.locator("text=Billing")).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
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
  72  |     await expect(page).toHaveURL(/\/users/);
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