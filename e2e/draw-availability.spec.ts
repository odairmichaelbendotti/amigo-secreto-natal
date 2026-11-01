import { test, expect } from "@playwright/test";

for (const approvedCount of [0, 1, 2]) {
  test(`draw availability explains the rule for ${approvedCount} approved participants`, async ({ page }) => {
    let drawn = false;
    const people = [
      ...Array.from({ length: approvedCount }, (_, index) => ({ id: `approved-${index}`, name: `Pessoa ${index}`, status: "APPROVED", _count: { wishlistItems: 0 } })),
      { id: "pending", name: "Pessoa Pendente", status: "PENDING", _count: { wishlistItems: 0 } },
    ];
    const assignments = [{ id: "pair-1", giver: { name: "Pessoa 0" }, receiver: { name: "Pessoa 1", wishlistItems: [] } }];
    await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, isAdmin: true, adminGroupId: "group-1", adminGroupName: "Grupo", adminInviteCode: "ABC123" } }));
    await page.route("**/api/people?*", route => route.fulfill({ json: { people } }));
    await page.route("**/api/groups/group-1", route => route.fulfill({ json: { group: {} } }));
    await page.route("**/api/assignments?*", route => route.fulfill({ json: { assignments: drawn ? assignments : [] } }));
    await page.route("**/api/assignments/generate", async route => {
      expect(approvedCount).toBe(2);
      drawn = true;
      await route.fulfill({ json: { assignments, count: 2 } });
    });
    await page.goto("/admin/dashboard");
    const section = page.getByRole("region", { name: "Sorteio", exact: true });
    const drawButton = section.getByRole("button", { name: "Realizar sorteio", exact: true });
    await expect(section.getByText(/Solicitações pendentes não contam/)).toBeVisible();
    if (approvedCount < 2) {
      await expect(drawButton).toBeDisabled();
      const reason = approvedCount === 0 ? "Ainda não há participantes aprovados" : "Falta aprovar mais 1 participante";
      await expect(section.getByRole("status")).toContainText(reason);
      await expect(drawButton).toHaveAccessibleDescription(new RegExp(reason));
      expect(drawn).toBe(false);
    } else {
      await expect(drawButton).toBeEnabled();
      await expect(section.getByText(/Com 2 participantes, um necessariamente tira o outro/)).toBeVisible();
      page.once("dialog", async dialog => {
        expect(dialog.message()).toContain("Com 2 participantes, um tirará o outro");
        await dialog.accept();
      });
      await drawButton.click();
      await expect(section.getByText(/O sorteio já foi realizado/)).toBeVisible();
      await expect(section.getByRole("button", { name: "Excluir resultados do sorteio" })).toBeVisible();
    }
  });
}
