import { test, expect } from "@playwright/test";
test("home page presents accounts and the invitation flow in Portuguese", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Gerador de Amigo Secreto", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Criar novo grupo/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
});
test("creation registers an account before creating a participating administrator", async ({ page }) => {
  let registered = false;
  await page.route("**/api/auth/session", route => route.fulfill({ json: registered ? { authenticated: true, user: { name: "Ana Organizadora" }, isAdmin: true, adminGroupId: "group-1", adminGroupName: "Família Silva" } : { authenticated: false } }));
  await page.route("**/api/auth/register", async route => {
    expect(route.request().postDataJSON()).toMatchObject({ name: "Ana Organizadora", email: "ana@example.com", password: "1234" }); registered = true;
    await route.fulfill({ status: 201, json: { user: { name: "Ana Organizadora" } } });
  });
  await page.route("**/api/people?*", route => route.fulfill({ json: { people: [] } }));
  await page.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: [] } }));
  await page.route("**/api/groups/group-1", route => route.fulfill({ json: { group: {} } }));
  await page.goto("/create");
  await page.getByLabel("Nome completo").fill("Ana Organizadora");
  await page.getByLabel("E-mail").fill("ana@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Nome do grupo").fill("Família Silva");
  await page.route("**/api/groups/create", async route => {
    expect(route.request().postDataJSON()).toMatchObject({ groupName: "Família Silva", adminParticipates: true });
    await route.fulfill({ status: 201, json: { group: { id: "group-1", name: "Família Silva" } } });
  });
  await page.getByRole("button", { name: "Criar grupo", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
});
test("login works without group metadata in browser storage", async ({ page }) => {
  await page.route("**/api/auth/login", async route => {
    expect(route.request().postDataJSON()).toMatchObject({ email: "ana@example.com", password: "1234" });
    await route.fulfill({ json: { user: { name: "Ana Silva" } } });
  });
  await page.route("**/api/account/groups", route => route.fulfill({ json: { user: { name: "Ana Silva", email: "ana@example.com" }, groups: [{ id: "group-1", name: "Família Silva", year: 2026, status: "APPROVED", isAdmin: false }] } }));
  await page.goto("/");
  await page.getByRole("link", { name: "Fazer login para entrar no grupo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Entre no seu amigo secreto" })).toBeVisible();
  await page.getByLabel("E-mail").fill("ana@example.com"); await page.getByLabel("Senha", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Fazer login e acessar meus grupos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Meus grupos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar no grupo" })).toBeVisible();
});
test("a group code opens the registration form", async ({ page }) => {
  await page.route("**/api/groups/verify", route => route.fulfill({ json: { group: { id: "group-1", name: "Família Silva", inviteCode: "A2B3C4", year: 2026 } } }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: false } }));
  await page.goto("/join");
  await page.getByLabel("Código do grupo").fill("A2B3C4");
  await page.getByRole("button", { name: "Abrir grupo" }).click();
  await expect(page.getByLabel("Nome completo")).toBeVisible(); await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByRole("link", { name: "Área do administrador" })).toHaveCount(0);
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("minlength", "4");
});
test("invitation works on mobile without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/groups/verify", route => route.fulfill({ json: { group: { id: "group-1", name: "Amigo secreto da família", inviteCode: "A2B3C4", year: 2026 } } }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: false } }));
  await page.goto("/join?code=A2B3C4");
  await expect(page.getByRole("button", { name: "Criar conta e solicitar entrada" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
