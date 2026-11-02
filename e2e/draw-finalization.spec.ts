import { test, expect } from "@playwright/test";

test("pairs remain hidden from the administrator until finishing, then become available to approved members", async ({ page, browser }) => {
  let drawn = false;
  let finishedAt: string | null = null;
  let finishCalls = 0;
  const people = ["Ana Silva", "Bia Oliveira", "Carlos Santos"].map((name, index) => ({ id: `p${index}`, name, status: "APPROVED", _count: { wishlistItems: 0 } }));
  const pairs = people.map((giver, index) => ({ id: `pair${index}`, giver: { name: giver.name }, receiver: { name: people[(index + 1) % people.length].name, wishlistItems: [] } }));
  const group = () => ({ id: "g1", name: "Natal em família", inviteCode: "ABC123", wishlistsEnabled: true, finishedAt });
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isAdmin: true, adminGroupId: "g1", adminGroupName: group().name, adminInviteCode: "ABC123" } }));
  await page.route("**/api/people?*", route => route.fulfill({ json: { people } }));
  await page.route("**/api/groups/g1", route => route.fulfill({ json: { group: group() } }));
  await page.route("**/api/assignments?*", route => route.fulfill({ json: { finishedAt, assignments: !drawn ? [] : finishedAt ? pairs : pairs.map(({ id, giver }) => ({ id, giver })) } }));
  await page.route("**/api/assignments/generate", route => { drawn = true; return route.fulfill({ json: { count: pairs.length } }); });
  await page.route("**/api/groups/g1/finish", route => { finishCalls++; finishedAt = "2026-12-25T12:00:00Z"; return route.fulfill({ json: { finishedAt } }); });

  const visitorContext = await browser.newContext({ serviceWorkers: "block", baseURL: "http://localhost:3000", viewport: { width: 390, height: 844 } });
  try {
    const visitor = await visitorContext.newPage();
    await visitor.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isLoggedIn: true, personId: "p0", personName: people[0].name, groupId: "g1", groupName: group().name } }));
    await visitor.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistsEnabled: true, wishlistItems: [], assignment: drawn ? { receiver: pairs[0].receiver } : null } }));
    await visitor.route("**/api/groups/g1", route => route.fulfill({ json: { group: group() } }));
    await visitor.route("**/api/assignments?*", route => route.fulfill({ json: { finishedAt, assignments: pairs } }));
    await visitor.goto("/wishlist");
    await visitor.getByLabel("Nome do item 1").fill("Meu rascunho");
    await expect(visitor.getByRole("tab", { name: "Resultado final", exact: true })).toHaveCount(0);

    await page.goto("/admin/dashboard");
    await expect(page.getByRole("button", { name: "Finalizar amigo secreto", exact: true })).toHaveCount(0);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Realizar sorteio", exact: true }).click();
    await page.getByRole("tab", { name: "Resultado", exact: true }).click();
    const result = page.getByRole("region", { name: "Resultado do sorteio (3)", exact: true });
    await expect(result.getByText("Resultado oculto", { exact: true })).toHaveCount(3);
    await expect(result.getByRole("button", { name: "Mostrar quem recebe", exact: true })).toHaveCount(0);
    await expect(result.getByRole("columnheader", { name: "Lista de desejos", exact: true })).toHaveCount(0);
    await visitor.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(visitor.getByText("Bia Oliveira", { exact: true })).toBeVisible();
    await expect(visitor.getByRole("tab", { name: "Resultado final", exact: true })).toHaveCount(0);

    page.once("dialog", dialog => dialog.dismiss());
    await page.getByRole("button", { name: "Finalizar amigo secreto", exact: true }).click();
    expect(finishCalls).toBe(0);
    await expect(result.getByText("Resultado oculto", { exact: true })).toHaveCount(3);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Finalizar amigo secreto", exact: true }).click();
    await expect(result.getByText("Resultado oculto", { exact: true })).toHaveCount(0);
    await expect(result.getByRole("row").nth(1).getByRole("cell").nth(1)).toHaveText("Bia Oliveira");
    expect(finishCalls).toBe(1);
    await page.reload();
    await page.getByRole("tab", { name: "Resultado", exact: true }).click();
    await expect(result.getByRole("row").nth(1).getByRole("cell").nth(1)).toHaveText("Bia Oliveira");
    await expect(page.getByRole("button", { name: "Finalizar amigo secreto", exact: true })).toHaveCount(0);
    await page.getByRole("tab", { name: "Visão geral", exact: true }).click();
    await expect(page.getByRole("button", { name: "Excluir resultados do sorteio", exact: true })).toHaveCount(0);

    await visitor.evaluate(() => window.dispatchEvent(new Event("focus")));
    await visitor.getByRole("tab", { name: "Resultado final", exact: true }).click();
    const finalResult = visitor.getByRole("region", { name: "Resultado do sorteio (3)", exact: true });
    await expect(finalResult.getByRole("row").nth(1).getByRole("cell").nth(1)).toHaveText("Bia Oliveira");
    await expect(finalResult.getByRole("columnheader", { name: "Lista de desejos", exact: true })).toHaveCount(0);
    expect(await visitor.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await visitor.getByRole("tab", { name: "Minha participação", exact: true }).click();
    await expect(visitor.getByLabel("Nome do item 1")).toHaveValue("Meu rascunho");
  } finally { await visitorContext.close(); }
});
