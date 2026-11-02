import { test, expect } from "@playwright/test";

test("the group's fruit ornaments can be applied and removed without affecting other groups or participation", async ({ page, browser }) => {
  let theme = "none";
  let saveFails = false;
  const group = () => ({ id: "g1", name: "Família reunida", year: 2026, theme, wishlistsEnabled: true, budgetAmount: 75, budgetCurrency: "BRL" });
  const people = [{ id: "p1", name: "Ana Silva", status: "APPROVED", _count: { wishlistItems: 1 } }, { id: "p2", name: "Bia Oliveira", status: "APPROVED", _count: { wishlistItems: 0 } }];
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isAdmin: true, adminGroupId: "g1", adminGroupName: group().name, adminInviteCode: "ABC123", adminPersonId: "p1", personId: "p1", isLoggedIn: true } }));
  await page.route("**/api/people?*", route => route.fulfill({ json: { people } }));
  await page.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: [{ id: "pair1", giver: { name: "Ana Silva" } }] } }));
  await page.route("**/api/groups/g1", async route => {
    if (route.request().method() === "PATCH") {
      expect(Object.keys(route.request().postDataJSON())).toEqual(["theme"]);
      if (saveFails) return route.fulfill({ status: 500, json: { error: "Não foi possível salvar o tema" } });
      theme = route.request().postDataJSON().theme;
    }
    return route.fulfill({ json: { group: group() } });
  });

  const visitorContext = await browser.newContext({ baseURL: "http://localhost:3000", viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  try {
    const visitor = await visitorContext.newPage();
    await visitor.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isLoggedIn: true, personId: "p1", personName: "Ana Silva", groupId: "g1", groupName: group().name } }));
    await visitor.route("**/api/account/groups", route => route.fulfill({ json: { user: { name: "Ana Silva", email: "ana@example.com" }, groups: [{ ...group(), status: "APPROVED", isAdmin: false }, { id: "g2", name: "Amigos do trabalho", year: 2026, theme: "none", status: "APPROVED", isAdmin: false }] } }));
    await visitor.route("**/api/groups/g1", route => route.fulfill({ json: { group: group() } }));
    await visitor.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistsEnabled: true, wishlistItems: [], assignment: { receiver: { name: "Bia Oliveira", wishlistItems: [] } } } }));
    await visitor.route("**/api/groups/g1/participants", route => route.fulfill({ json: { participants: people.map(person => ({ id: person.id, name: person.name, isAdmin: person.id === "p1" })) } }));
    await page.goto("/admin/dashboard");
    await page.getByRole("tab", { name: "Configurações", exact: true }).click();
    const picker = page.getByRole("region", { name: "Tema do grupo", exact: true });
    await expect(picker.getByRole("radio", { name: /Sem tema/ })).toBeChecked();
    await picker.getByRole("radio", { name: /Frutas/ }).check();
    await picker.getByRole("button", { name: "Aplicar tema", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Tema de frutas aplicado ao grupo." })).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: "Configurações", exact: true }).click();
    await expect(picker.getByRole("radio", { name: /Frutas/ })).toBeChecked();

    await visitor.goto("/groups");
    await expect(visitor.getByRole("article").filter({ hasText: "Família reunida" })).toHaveAttribute("data-group-theme", "fruits");
    await expect(visitor.getByRole("article").filter({ hasText: "Amigos do trabalho" })).toHaveAttribute("data-group-theme", "none");
    await expect(visitor.locator(".group-card-fruit")).toHaveCount(1);
    await visitor.goto("/wishlist");
    await expect(visitor.locator(".group-surface")).toHaveAttribute("data-group-theme", "fruits");
    await expect(visitor.locator(".recipient-fruit")).toBeVisible();
    await expect(visitor.getByText("Bia Oliveira", { exact: true })).toBeVisible();
    await visitor.getByLabel("Nome do item 1").fill("Meu rascunho");
    await visitor.getByRole("tab", { name: "Participantes", exact: true }).click();
    await expect(visitor.getByRole("list", { name: "Participantes aprovados" }).getByText("Bia Oliveira", { exact: true })).toBeVisible();
    await expect(visitor.locator(".group-header-fruit")).toBeVisible();
    expect(await visitor.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

    saveFails = true;
    await picker.getByRole("radio", { name: /Sem tema/ }).check();
    await picker.getByRole("button", { name: "Aplicar tema", exact: true }).click();
    await expect(page.getByText("Não foi possível salvar o tema", { exact: true })).toBeVisible();
    expect(theme).toBe("fruits");
    saveFails = false;
    await picker.getByRole("button", { name: "Aplicar tema", exact: true }).click();
    await expect(page.getByText("Tema removido. O grupo voltou ao visual original.", { exact: true })).toBeVisible();
    await visitor.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(visitor.locator(".group-surface")).toHaveAttribute("data-group-theme", "none");
    await expect(visitor.locator(".group-header-fruit")).toHaveCount(0);
    await visitor.getByRole("tab", { name: "Minha participação", exact: true }).click();
    await expect(visitor.getByLabel("Nome do item 1")).toHaveValue("Meu rascunho");
    await expect(visitor.getByText("Bia Oliveira", { exact: true })).toBeVisible();
    await visitor.goto("/groups");
    await expect(visitor.locator(".group-card-fruit")).toHaveCount(0);
  } finally { await visitorContext.close(); }
});
