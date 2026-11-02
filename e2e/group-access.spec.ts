import { test, expect } from "@playwright/test";

test("a creator's approved group can be opened after safe, persistent server error messages", async ({ page }) => {
  let attempts = 0;
  let listRequests = 0;
  const group = { id: "g1", name: "Família reunida", year: 2026, wishlistsEnabled: false, status: "APPROVED", isAdmin: true };
  await page.route("**/api/account/groups", route => {
    listRequests++;
    return route.fulfill({ json: { user: { id: "u1", name: listRequests === 1 ? "Ana Silva" : "Ana Atualizada", email: "ana@example.com" }, groups: [group] } });
  });
  await page.route("**/api/groups/g1/select", route => {
    attempts++;
    if (attempts === 1) return route.fulfill({ status: 500, contentType: "text/html", body: "<html><body>Internal Server Error</body></html>" });
    if (attempts === 2) return route.fulfill({ status: 503, json: { error: "O grupo está indisponível até que a atualização da aplicação seja concluída.", code: "DATABASE_SCHEMA_OUTDATED" } });
    return route.fulfill({ json: { isAdmin: true, isLoggedIn: true } });
  });
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isAdmin: true, adminGroupId: "g1", adminGroupName: group.name, adminInviteCode: "ABC123", adminPersonId: "p1", isLoggedIn: true, personId: "p1", personName: "Ana Silva", groupId: "g1", groupName: group.name } }));
  await page.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistsEnabled: false, wishlistItems: [], assignment: null } }));
  await page.route("**/api/groups/g1", route => route.fulfill({ json: { group } }));
  await page.route("**/api/people?*", route => route.fulfill({ json: { people: [{ id: "p1", name: "Ana Silva", status: "APPROVED", _count: { wishlistItems: 0 } }] } }));
  await page.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: [] } }));

  await page.goto("/groups");
  const enter = page.getByRole("button", { name: "Entrar no grupo", exact: true });
  await enter.click();
  const error = page.getByRole("alert").filter({ hasText: "O servidor não conseguiu abrir o grupo" });
  await expect(error).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Ana Atualizada · ana@example.com", { exact: true })).toBeVisible();
  await expect(error).toBeVisible();
  await enter.click();
  await expect(page.getByText("O grupo está indisponível até que a atualização da aplicação seja concluída.", { exact: true })).toBeVisible();
  await enter.click();
  await expect(page).toHaveURL(/\/wishlist$/);
  await expect(page.getByRole("heading", { name: "Olá, Ana Silva!", exact: true })).toBeVisible();
  await page.goto("/groups");
  await page.getByRole("button", { name: "Administrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Painel do administrador", exact: true })).toBeVisible();
});
