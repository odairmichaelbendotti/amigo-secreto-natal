import { expect, test, type Page } from "@playwright/test";

interface State {
  wishes: { title: string; link?: string }[][];
  drawn: boolean;
  enabled: boolean;
  failSave?: boolean;
}
const names = ["Ana Silva", "Bia Oliveira", "Caio Santos"];
const initialState = (): State => ({
  wishes: [[], [{ title: "Livro de receitas" }, { title: "Chocolate amargo" }], [{ title: "Camiseta tamanho M" }]],
  drawn: false, enabled: true,
});

async function installRoutes(page: Page, state: State, owner = 0) {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isLoggedIn: true, personId: `p${owner}`, personName: names[owner], groupId: "g1", groupName: "Natal em família" } }));
  await page.route("**/api/groups/g1", route => route.fulfill({ json: { group: { wishlistsEnabled: state.enabled } } }));
  await page.route("**/api/auth/person-data", route => route.fulfill({ json: {
    wishlistsEnabled: state.enabled,
    wishlistItems: state.enabled ? state.wishes[owner] : [],
    assignment: state.drawn ? { receiver: { name: names[(owner + 1) % 3], wishlistItems: state.enabled ? state.wishes[(owner + 1) % 3] : [] } } : null,
  } }));
  await page.route("**/api/groups/g1/participants", route => route.fulfill({ json: {
    wishlistsEnabled: state.enabled,
    participants: names.map((name, index) => ({ id: `p${index}`, name, isAdmin: index === 0, wishlistItems: state.enabled ? state.wishes[index] : [] })),
  } }));
  await page.route("**/api/wishlist", async route => {
    if (state.failSave) return route.fulfill({ status: 500, json: { error: "Não foi possível salvar. Tente novamente." } });
    const body = route.request().postDataJSON();
    expect(body.personId).toBe(`p${owner}`);
    expect(body.items.every((item: { title: string }) => typeof item.title === "string")).toBe(true);
    state.wishes[owner] = body.items;
    await route.fulfill({ json: { wishlistItems: state.wishes[owner] } });
  });
}

test("any member sees everyone's wishes on the main page and the drawn person's wishes on their card", async ({ page }, testInfo) => {
  const state = initialState();
  await installRoutes(page, state);
  await page.goto("/wishlist");
  const roster = page.getByRole("region", { name: "Quem já está participando (3)" });
  await expect(roster.getByRole("list", { name: "Desejos de Bia Oliveira" })).toContainText("Livro de receitas");
  await expect(roster.getByRole("list", { name: "Desejos de Caio Santos" })).toContainText("Camiseta tamanho M");
  await expect(page.getByText("O sorteio do amigo secreto ainda não foi realizado.")).toBeVisible();

  state.drawn = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const recipient = page.locator(".recipient-panel");
  await expect(recipient.getByText("Bia Oliveira", { exact: true })).toBeVisible();
  await expect(recipient.getByRole("list", { name: "Desejos de Bia Oliveira" })).toContainText("Chocolate amargo");
  await expect(recipient.getByRole("link")).toHaveCount(0);
  state.wishes[1] = [{ title: "Kit de aquarela" }];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(recipient.getByText("Kit de aquarela", { exact: true })).toBeVisible();
  await expect(roster.getByText("Kit de aquarela", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: testInfo.outputPath("wishlist-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("wishlist-mobile.png"), fullPage: true });
});

test("a participant saves names only, another member sees them, and the owner can clear the list", async ({ page, browser, baseURL }) => {
  const state = initialState();
  await installRoutes(page, state);
  await page.goto("/wishlist");
  await expect(page.locator('input[type="url"], input[type="number"]')).toHaveCount(0);
  await page.getByLabel("Nome do item 1").fill("Meias divertidas");
  await page.getByRole("button", { name: "Adicionar item", exact: true }).click();
  await page.getByLabel("Nome do item 2").fill("Um livro de aventura");
  await page.getByRole("button", { name: "Salvar lista de desejos", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Lista de desejos salva com sucesso!");
  await page.reload();
  await expect(page.getByLabel("Nome do item 1")).toHaveValue("Meias divertidas");
  await expect(page.getByLabel("Nome do item 2")).toHaveValue("Um livro de aventura");

  const context = await browser.newContext({ baseURL, serviceWorkers: "block" });
  try {
    const other = await context.newPage();
    await installRoutes(other, state, 2);
    await other.goto("/wishlist");
    const wishes = other.getByRole("list", { name: "Desejos de Ana Silva" });
    await expect(wishes).toContainText("Meias divertidas");
    await expect(wishes).toContainText("Um livro de aventura");
    await page.getByRole("button", { name: "Remover item 2", exact: true }).click();
    await page.getByRole("button", { name: "Remover item 1", exact: true }).click();
    await page.getByRole("button", { name: "Salvar lista de desejos", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Lista de desejos salva com sucesso!");
    await other.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(wishes).toHaveCount(0);
  } finally { await context.close(); }
});

test("a failed save preserves the draft for retry", async ({ page }) => {
  const state = { ...initialState(), failSave: true };
  await installRoutes(page, state);
  await page.goto("/wishlist");
  await page.getByLabel("Nome do item 1").fill("Chocolate branco");
  await page.getByRole("button", { name: "Salvar lista de desejos", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Não foi possível salvar." })).toHaveText("Não foi possível salvar. Tente novamente.");
  await expect(page.getByLabel("Nome do item 1")).toHaveValue("Chocolate branco");
  state.failSave = false;
  await page.getByRole("button", { name: "Salvar lista de desejos", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Lista de desejos salva com sucesso!");
});

test("hidden lists disappear from the roster and recipient card on refresh", async ({ page }) => {
  const state = { ...initialState(), drawn: true };
  await installRoutes(page, state);
  await page.goto("/wishlist");
  await expect(page.locator(".recipient-panel").getByText("Livro de receitas", { exact: true })).toBeVisible();
  state.enabled = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("heading", { name: "Minha lista de desejos", exact: true })).toHaveCount(0);
  await expect(page.getByText("Livro de receitas", { exact: true })).toHaveCount(0);
  await expect(page.locator(".recipient-panel").getByText("Bia Oliveira", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Participantes", exact: true }).click();
  await expect(page.getByRole("list", { name: "Participantes aprovados" })).toBeVisible();
  await expect(page.getByRole("list", { name: /Desejos de/ })).toHaveCount(0);
});
