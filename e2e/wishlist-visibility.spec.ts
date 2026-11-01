import { test, expect } from "@playwright/test";

test("administrator can hide and restore wishlists while participants keep access to the draw", async ({ page, browser }) => {
  let enabled = true;
  let drawn = false;
  const group = { id: "group-1", name: "Amigo secreto livre", inviteCode: "ABC123", budgetAmount: 75, budgetCurrency: "BRL" };
  const savedItem = { id: "item-1", title: "Um livro", link: "https://example.com/livro" };
  const people = [{ id: "person-1", name: "Ana Silva", status: "APPROVED", _count: { wishlistItems: 1 } }, { id: "person-2", name: "Bia Silva", status: "APPROVED", _count: { wishlistItems: 0 } }];
  const pairs = [{ id: "pair-1", giver: { name: "Ana Silva" }, receiver: { name: "Bia Silva", wishlistItems: enabled ? [savedItem] : [] } }];
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isAdmin: true, adminGroupId: group.id, adminGroupName: group.name, adminInviteCode: group.inviteCode, adminPersonId: people[0].id, personId: people[0].id, isLoggedIn: true } }));
  await page.route("**/api/people?*", route => route.fulfill({ json: { people } }));
  await page.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: drawn ? pairs : [] } }));
  await page.route("**/api/groups/group-1", async route => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      expect(Object.keys(body)).toEqual(["wishlistsEnabled"]);
      enabled = body.wishlistsEnabled;
    }
    await route.fulfill({ json: { group: { ...group, wishlistsEnabled: enabled } } });
  });
  await page.route("**/api/assignments/generate", async route => { drawn = true; await route.fulfill({ json: { assignments: pairs, count: 2 } }); });
  const visitorContext = await browser.newContext({ serviceWorkers: "block", baseURL: "http://localhost:3000", viewport: { width: 390, height: 844 } });
  try {
    const visitor = await visitorContext.newPage();
    await visitor.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isLoggedIn: true, personId: people[0].id, personName: people[0].name, groupId: group.id, groupName: group.name } }));
    await visitor.route("**/api/groups/group-1", route => route.fulfill({ json: { group: { ...group, wishlistsEnabled: enabled } } }));
    await visitor.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistsEnabled: enabled, wishlistItems: enabled ? [savedItem] : [], assignment: drawn ? { receiver: { name: "Bia Silva", wishlistItems: enabled ? [savedItem] : [] } } : null } }));
    await visitor.goto("/wishlist");
    await expect(visitor.getByLabel("Nome do item 1")).toHaveValue(savedItem.title);
    await page.goto("/admin/dashboard");
    const toggle = page.getByRole("switch", { name: "Exibir listas de desejos" });
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
    await page.reload();
    await expect(toggle).not.toBeChecked();
    await expect(page.getByText("Valor atual: R$", { exact: false })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Lista de desejos", exact: true })).toHaveCount(0);
    await visitor.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(visitor.getByText("Neste grupo, a escolha do presente é livre")).toBeVisible();
    await expect(visitor.getByRole("heading", { name: "Minha lista de desejos" })).toHaveCount(0);
    await expect(visitor.getByRole("button", { name: "Salvar lista de desejos" })).toHaveCount(0);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Realizar sorteio", exact: true }).click();
    await visitor.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(visitor.getByText("Bia Silva", { exact: true })).toBeVisible();
    await expect(visitor.getByRole("heading", { name: /Lista de desejos de/ })).toHaveCount(0);
    await expect(visitor.getByText(/ainda não adicionou uma lista/)).toHaveCount(0);
    await toggle.check();
    await expect(toggle).toBeChecked();
    await visitor.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(visitor.getByLabel("Nome do item 1")).toHaveValue(savedItem.title);
    await expect(visitor.getByRole("heading", { name: "Lista de desejos de Bia Silva:" })).toBeVisible();
  } finally { await visitorContext.close(); }
});
