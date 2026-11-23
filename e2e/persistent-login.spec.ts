import { expect, test } from "@playwright/test";

for (const destination of ["/groups", "/create"]) {
  test(`an existing account skips the login form and continues to ${destination}`, async ({ page }) => {
    const user = { name: "Ana Silva", email: "ana@example.com" };
    await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, user } }));
    await page.route("**/api/account/groups", route => route.fulfill({ json: { user, groups: [] } }));
    await page.goto(destination === "/create" ? "/login?next=/create" : "/login");
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.getByLabel("Senha", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: destination === "/create" ? "Crie seu grupo" : "Meus grupos", exact: true })).toBeVisible();
  });
}

test("anonymous visitors can still enter their credentials", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: false } }));
  await page.goto("/login");
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
});
