import { test, expect, type Page } from "@playwright/test";
test.describe("account invitation approval", () => {
  for (const decision of ["APPROVED", "REJECTED"] as const) {
    test(`registered participant receives ${decision} in Meus grupos`, async ({ page, browser }) => {
      let status: "PENDING" | "APPROVED" | "REJECTED" | null = null;
      const group = { id: "group-1", name: "Família Silva", inviteCode: "A2B3C4", year: 2026 };
      const person = { id: "person-1", name: "João da Silva", _count: { wishlistItems: 0 } };
      const user = { name: person.name, email: "joao@example.com" };
      await page.route("**/api/groups/verify", route => route.fulfill({ json: { group } }));
      await page.route("**/api/auth/session", route => route.fulfill({ json: { user: status ? user : null, authenticated: Boolean(status), isLoggedIn: status === "APPROVED", personId: person.id, personName: person.name, groupId: group.id, groupName: group.name } }));
      await page.route("**/api/auth/register", async route => {
        expect(route.request().postDataJSON()).toEqual({ name: person.name, email: user.email, password: "1234", inviteCode: group.inviteCode });
        status = "PENDING"; await route.fulfill({ status: 201, json: { user } });
      });
      await page.route("**/api/account/groups", route => route.fulfill({ json: { user, groups: [{ ...group, status, isAdmin: false }] } }));
      await page.route("**/api/groups/group-1/select", route => route.fulfill({ json: { isLoggedIn: true, isAdmin: false } }));
      await page.route("**/api/auth/person-data", route => route.fulfill({ json: { wishlistItems: [], assignment: null } }));
      await page.route("**/api/groups/group-1", route => route.fulfill({ json: { group } }));
      await page.goto("/join?code=A2B3C4");
      await page.getByLabel("Nome completo").fill(person.name); await page.getByLabel("E-mail").fill(user.email); await page.getByLabel("Senha", { exact: true }).fill("1234");
      await page.getByRole("button", { name: "Criar conta e solicitar entrada" }).click();
      await expect(page).toHaveURL(/\/groups$/);
      await expect(page.getByText("Aguardando aprovação do administrador")).toBeVisible();
      await expect(page.getByText("Seu código pessoal")).toHaveCount(0);
      const adminContext = await browser.newContext({ serviceWorkers: "block", baseURL: new URL(page.url()).origin });
      const admin = await adminContext.newPage();
      try {
        await setupAdmin(admin); await admin.goto("/admin/dashboard");
        await expect(admin.getByRole("heading", { name: "Solicitações pendentes (1)" })).toBeVisible();
        await admin.getByRole("button", { name: decision === "APPROVED" ? "Aprovar" : "Não aprovar", exact: true }).click();
        if (decision === "APPROVED") {
          await expect(page.getByRole("button", { name: "Entrar no grupo" })).toBeVisible({ timeout: 10000 });
          await page.getByRole("button", { name: "Entrar no grupo" }).click();
          await expect(page.getByRole("heading", { name: "Minha lista de desejos" })).toBeVisible();
        } else {
          await expect(page.getByText("Solicitação não aprovada. Fale com o organizador.")).toBeVisible({ timeout: 10000 });
          await expect(page.getByRole("button", { name: "Entrar no grupo" })).toHaveCount(0);
        }
      } finally { await adminContext.close(); }
      async function setupAdmin(admin: Page) {
        await admin.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isAdmin: true, adminGroupId: group.id, adminGroupName: group.name, adminInviteCode: group.inviteCode } }));
        await admin.route("**/api/people?*", route => route.fulfill({ json: { people: status ? [{ ...person, status }] : [] } }));
        await admin.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: [] } }));
        await admin.route("**/api/groups/group-1", route => route.fulfill({ json: { group } }));
        await admin.route("**/api/people/person-1", async route => { expect(route.request().postDataJSON()).toEqual({ status: decision }); status = decision; await route.fulfill({ json: { person: { ...person, status } } }); });
      }
    });
  }
});
