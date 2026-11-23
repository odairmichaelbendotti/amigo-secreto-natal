import { test, expect, type Page } from "@playwright/test";
import { sealData, unsealData } from "iron-session";

const cookieName = "secret-santa-session";
const cookieSecret = "home-browser-test-only-secret-of-at-least-32-characters";
const user = { id: "u1", name: "Ana Silva", email: "ana@example.com" };
interface Controls { unavailable?: boolean; logoutFails?: boolean; wait?: Promise<void> }

async function installSession(page: Page, controls: Controls = {}) {
  const token = await sealData({ userId: user.id }, { password: cookieSecret, ttl: 86400 });
  await page.route("**/api/auth/session", async route => {
    if (controls.wait) await controls.wait;
    if (controls.unavailable) return route.fulfill({ status: 503, json: { error: "Serviço temporariamente indisponível" } });
    const raw = (route.request().headers().cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const data = raw ? await unsealData<{ userId?: string }>(raw, { password: cookieSecret, ttl: 86400 }) : {};
    return route.fulfill({ headers: { "Cache-Control": "private, no-store" }, json: data.userId === user.id ? { authenticated: true, user, isLoggedIn: false, isAdmin: false } : { authenticated: false } });
  });
  await page.route("**/api/auth/login", route => route.fulfill({ headers: { "Set-Cookie": `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400` }, json: { user } }));
  await page.route("**/api/auth/logout", route => controls.logoutFails ? route.fulfill({ status: 500, json: { error: "Falha ao sair" } }) : route.fulfill({ headers: { "Set-Cookie": `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }, json: { success: true } }));
  await page.route("**/api/account/groups", route => route.fulfill({ json: { user, groups: [] } }));
  return token;
}

test("login persists in an HttpOnly cookie and the home page recognizes it after reload and a new browser context", async ({ page, browser, baseURL }) => {
  await installSession(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Fazer login para entrar no grupo", exact: true }).click();
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Fazer login e acessar meus grupos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Meus grupos", exact: true })).toBeVisible();
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navegação principal", exact: true });
  await expect(nav.getByText("Olá, Ana!", { exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Fazer login", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acessar meus grupos", exact: true })).toHaveAttribute("href", "/groups");
  expect(await page.evaluate(() => document.cookie)).not.toContain(cookieName);
  expect((await page.context().cookies()).find(cookie => cookie.name === cookieName)?.httpOnly).toBe(true);
  await page.reload();
  await expect(nav.getByText("Olá, Ana!", { exact: true })).toBeVisible();

  const restored = await browser.newContext({ baseURL, storageState: await page.context().storageState(), serviceWorkers: "block", viewport: { width: 320, height: 844 } });
  try {
    const returning = await restored.newPage();
    await installSession(returning);
    await returning.goto("/");
    await expect(returning.getByText("Olá, Ana!", { exact: true })).toBeVisible();
    expect(await returning.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  } finally { await restored.close(); }
});

test("the home page waits for cookie verification and signing out clears the account after reload", async ({ page, baseURL }) => {
  let release!: () => void;
  const controls: Controls = { wait: new Promise<void>(resolve => { release = resolve; }) };
  const token = await installSession(page, controls);
  await page.context().addCookies([{ name: cookieName, value: token, url: baseURL!, httpOnly: true, expires: Math.floor(Date.now() / 1000) + 86400 }]);
  await page.goto("/");
  await expect(page.getByText("Verificando acesso...", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toHaveCount(0);
  release();
  await expect(page.getByText("Olá, Ana!", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta", exact: true }).click();
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toBeVisible();
  expect((await page.context().cookies()).some(cookie => cookie.name === cookieName)).toBe(false);
  await page.reload();
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toBeVisible();
});

test("invalid cookies are anonymous and returning to the tab refreshes login and expiration automatically", async ({ page, baseURL }) => {
  const token = await installSession(page);
  await page.context().addCookies([{ name: cookieName, value: "tampered-cookie", url: baseURL!, httpOnly: true }]);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toBeVisible();
  await page.context().addCookies([{ name: cookieName, value: token, url: baseURL!, httpOnly: true, expires: Math.floor(Date.now() / 1000) + 86400 }]);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Olá, Ana!", { exact: true })).toBeVisible();
  await page.context().addCookies([{ name: cookieName, value: token, url: baseURL!, httpOnly: true, expires: Math.floor(Date.now() / 1000) - 10 }]);
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toBeVisible();
  await expect(page.getByText("Olá, Ana!", { exact: true })).toHaveCount(0);
});

test("temporary session and logout failures preserve a known account and allow retrying", async ({ page, baseURL }) => {
  const controls: Controls = {};
  const token = await installSession(page, controls);
  await page.context().addCookies([{ name: cookieName, value: token, url: baseURL!, httpOnly: true }]);
  await page.goto("/");
  await expect(page.getByText("Olá, Ana!", { exact: true })).toBeVisible();
  controls.unavailable = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Não foi possível verificar seu acesso. Tente novamente.", { exact: false })).toBeVisible();
  await expect(page.getByText("Olá, Ana!", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fazer login", exact: true })).toHaveCount(0);
  controls.unavailable = false;
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tentar novamente", exact: true })).toHaveCount(0);
  controls.logoutFails = true;
  await page.getByRole("button", { name: "Sair da conta", exact: true }).click();
  await expect(page.getByText("Não foi possível sair da conta. Tente novamente.", { exact: false })).toBeVisible();
  await expect(page.getByText("Olá, Ana!", { exact: true })).toBeVisible();
  expect((await page.context().cookies()).some(cookie => cookie.name === cookieName)).toBe(true);
});
