import { test, expect } from "@playwright/test";

test("administrator can create a group without participating", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { user: { name: "Ana Administradora" }, authenticated: true, isAdmin: true, adminGroupId: "group-1", adminGroupName: "Grupo", adminInviteCode: "ABC123" } }));
  await page.route("**/api/people?*", route => route.fulfill({ json: { people: [] } }));
  await page.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: [] } }));
  await page.route("**/api/groups/group-1", route => route.fulfill({ json: { group: {} } }));
  await page.goto("/create");
  await page.getByLabel("Quero participar do amigo secreto").uncheck();
  await expect(page.getByLabel("Seu nome", { exact: true })).toHaveCount(0);
  await page.getByLabel("Nome do grupo").fill("Grupo sem organizador no sorteio");
  await page.route("**/api/groups/create", async (route) => {
    expect(route.request().postDataJSON().adminParticipates).toBe(false);
    await route.fulfill({ json: { group: { id: "group-1", name: "Grupo", inviteCode: "ABC123" } } });
  });
  await page.getByRole("button", { name: "Criar grupo", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
});

test("administrator can register participation in an existing group", async ({ page }) => {
  let participating = false;
  const person = { id: "admin-person", name: "Ana Administradora", status: "APPROVED", _count: { wishlistItems: 0 } };
  await page.route("**/api/auth/session", (route) => route.fulfill({
    json: {
      authenticated: true, isAdmin: true, adminGroupId: "group-1", adminGroupName: "Grupo", adminInviteCode: "ABC123",
      adminPersonId: participating ? person.id : undefined,
      isLoggedIn: participating, personId: participating ? person.id : undefined,
      personName: participating ? person.name : undefined, groupId: participating ? "group-1" : undefined,
    },
  }));
  await page.route("**/api/people?*", (route) => route.fulfill({ json: { people: participating ? [person] : [] } }));
  await page.route("**/api/assignments?*", (route) => route.fulfill({ json: { assignments: [] } }));
  await page.route("**/api/groups/group-1", (route) => route.fulfill({ json: { group: {} } }));
  await page.route("**/api/auth/person-data", (route) => route.fulfill({ json: { wishlistItems: [], assignment: null } }));
  await page.route("**/api/admin/participation", async (route) => {
    expect(route.request().postDataJSON().name).toBe(person.name);
    participating = true;
    await route.fulfill({ json: { person: { id: person.id, name: person.name } } });
  });

  await page.goto("/admin/dashboard");
  await expect(page.getByRole("heading", { name: "Sua participação no sorteio" })).toBeVisible();
  await page.getByLabel("Seu nome como participante").fill(person.name);
  await page.getByRole("button", { name: "Participar do sorteio", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sua participação no sorteio" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Participantes", exact: true }).click();
  await expect(page.getByRole("row", { name: /Ana Administradora/ })).toBeVisible();
  await page.getByRole("link", { name: "Minha participação" }).click();
  await expect(page.getByRole("heading", { name: "Minha lista de desejos" })).toBeVisible();
});
