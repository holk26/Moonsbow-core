import { test, expect } from "@playwright/test";

// E2E user registered through the real API (no dev backdoor).
// Requires the backend running locally (docker compose up).
const E2E_EMAIL = "e2e-test@moonsbow.local";
const E2E_PASSWORD = "E2eTestPass123!";
const E2E_API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

async function ensureE2EUser(page: any) {
  await page.request.post(`${E2E_API_URL}/api/v1/auth/register`, {
    data: { email: E2E_EMAIL, password: E2E_PASSWORD },
  });
  // 409 Conflict (already registered) is expected on subsequent runs.
}

async function login(page: any) {
  await ensureE2EUser(page);
  await page.goto("/login");
  await page.fill('input[type="email"]', E2E_EMAIL);
  await page.fill('input[type="password"]', E2E_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

test.describe("Auth", () => {
  test("login with dev user redirects to dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Bienvenido")).toBeVisible();
  });

  test("logout redirects to login", async ({ page }) => {
    await login(page);
    await page.click("text=Cerrar sesión");
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard shows stats cards", async ({ page }) => {
    await expect(page.locator("text=Tenants")).toBeVisible();
    await expect(page.locator("text=Usuarios")).toBeVisible();
    await expect(page.locator("text=Apps")).toBeVisible();
    await expect(page.locator("text=Suscripciones")).toBeVisible();
  });

  test("dashboard shows modules section", async ({ page }) => {
    await expect(page.locator("text=Módulos activos")).toBeVisible();
    await expect(page.locator("text=Auth")).toBeVisible();
    await expect(page.locator("text=Billing")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigate to tenants page", async ({ page }) => {
    await page.click("text=Tenants");
    await expect(page).toHaveURL(/\/tenants/);
    await expect(page.locator("text=Gestiona las organizaciones")).toBeVisible();
  });

  test("navigate to apps page", async ({ page }) => {
    await page.click("text=Aplicaciones");
    await expect(page).toHaveURL(/\/apps/);
    await expect(page.locator("text=Nueva App")).toBeVisible();
  });

  test("navigate to billing page", async ({ page }) => {
    await page.click("text=Billing");
    await expect(page).toHaveURL(/\/billing/);
    await expect(page.locator("text=Gestiona las suscripciones")).toBeVisible();
  });

  test("navigate to users page", async ({ page }) => {
    await page.click("text=Usuarios");
    await expect(page).toHaveURL(/\/users/);
    await expect(page.locator("text=Gestión de usuarios")).toBeVisible();
  });

  test("navigate to events page", async ({ page }) => {
    await page.click("text=Eventos");
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator("text=Log de eventos")).toBeVisible();
  });

  test("navigate to notifications page", async ({ page }) => {
    await page.click("text=Notificaciones");
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.locator("text=Centro de notificaciones")).toBeVisible();
  });
});

test.describe("Tenants CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click("text=Tenants");
  });

  test("create tenant flow", async ({ page }) => {
    await page.click("text=Nuevo Tenant");
    await page.fill('input[id="name"]', "E2E Test Tenant");
    await page.fill('input[id="slug"]', `e2e-tenant-${Date.now()}`);
    await page.fill('input[id="plan"]', "pro");
    await page.click('button:has-text("Crear tenant")');
    await expect(page.locator("text=Tenant creado correctamente")).toBeVisible();
  });
});

test.describe("Apps CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click("text=Aplicaciones");
  });

  test("create app flow", async ({ page }) => {
    await page.click("text=Nueva App");
    await page.fill('input[id="name"]', "E2E Test App");
    await page.fill('input[id="slug"]', `e2e-app-${Date.now()}`);
    await page.click('button:has-text("Crear")');
    await expect(page.locator("text=App creada correctamente")).toBeVisible();
  });
});
