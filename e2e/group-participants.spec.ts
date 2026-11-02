import { test, expect } from "@playwright/test";

test("members can see and refresh the approved roster without losing their wishlist draft", async ({ page }) => {
  let includeNewParticipant = false;
  let accessAllowed = true;
  const members = [{ id: "person-1", name: "Ana Silva", isAdmin: false }, { id: "person-2", name: "João Silva", isAdmin: true }];
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isLoggedIn: true, personId: "person-1", personName: "Ana Silva", groupId: "group-1", groupName: "Família reunida" } }));
  await page.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistItems: [], assignment: null, wishlistsEnabled: true } }));
  await page.route("**/api/groups/group-1", route => route.fulfill({ json: { group: { wishlistsEnabled: true } } }));
  await page.route("**/api/groups/group-1/participants", route => accessAllowed ? route.fulfill({ json: { participants: includeNewParticipant ? [...members, { id: "person-3", name: "Maria Silva", isAdmin: false }] : members } }) : route.fulfill({ status: 403, json: { error: "É necessário ter participação aprovada neste grupo" } }));
  await page.goto("/wishlist");
  await page.getByLabel("Nome do item 1").fill("Meu rascunho");
  await page.getByRole("tab", { name: "Participantes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quem já está participando (2)" })).toBeVisible();
  const list = page.getByRole("list", { name: "Participantes aprovados" });
  await expect(list.getByText("Ana Silva", { exact: true })).toBeVisible();
  await expect(list.getByText("Você", { exact: true })).toBeVisible();
  await expect(list.getByText("João Silva", { exact: true })).toBeVisible();
  await expect(list.getByText("Administrador", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprovar", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remover", exact: true })).toHaveCount(0);
  includeNewParticipant = true;
  await page.getByRole("button", { name: "Atualizar lista", exact: true }).click();
  await expect(list.getByText("Maria Silva", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quem já está participando (3)" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("tab", { name: "Minha participação", exact: true }).click();
  await expect(page.getByLabel("Nome do item 1")).toHaveValue("Meu rascunho");
  await page.getByRole("tab", { name: "Participantes", exact: true }).click();
  accessAllowed = false;
  await page.getByRole("button", { name: "Atualizar lista", exact: true }).click();
  await expect(page.getByRole("region", { name: "Quem já está participando" }).getByRole("alert")).toHaveText("É necessário ter participação aprovada neste grupo");
  await expect(list).toHaveCount(0);
});

test("the approved roster remains available when wishlists are hidden", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isLoggedIn: true, personId: "person-1", personName: "Ana Silva", groupId: "group-1", groupName: "Família reunida" } }));
  await page.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistItems: [], assignment: null, wishlistsEnabled: false } }));
  await page.route("**/api/groups/group-1", route => route.fulfill({ json: { group: { wishlistsEnabled: false } } }));
  await page.route("**/api/groups/group-1/participants", route => route.fulfill({ json: { participants: [{ id: "person-1", name: "Ana Silva", isAdmin: false }] } }));
  await page.goto("/wishlist");
  await page.getByRole("tab", { name: "Participantes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Quem já está participando (1)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Minha lista de desejos" })).toHaveCount(0);
});
