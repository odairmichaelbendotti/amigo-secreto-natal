import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("creation page recovers from a legacy worker with stale JavaScript", async ({ page, context }) => {
  await context.route("**/sw.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `
      self.addEventListener('install', () => self.skipWaiting());
      self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
      self.addEventListener('fetch', (event) => {
        if (new URL(event.request.url).pathname.startsWith('/_next/static/')) {
          event.respondWith(caches.open('secret-santa-v2-pt-BR').then(async (cache) => {
            return (await cache.match(event.request)) || fetch(event.request);
          }));
        }
      });
    `,
  }));

  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: false } }));
  await page.goto("/create");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    }

    const scriptUrl = "/_next/static/chunks/app/create/page.js";
    const response = await fetch(scriptUrl);
    const source = await response.text();
    if (!source.includes("Essa senha")) throw new Error("Creation page bundle was not found");
    const cache = await caches.open("secret-santa-v2-pt-BR");
    await cache.put(scriptUrl, new Response(source.replaceAll("Essa senha", "Texto antigo"), { headers: response.headers }));
    await caches.open("hydration-test-unrelated");
  });

  // Removing a controlling worker requires one navigation before it releases the page.
  await page.reload({ waitUntil: "domcontentloaded" }).catch((error: Error) => {
    if (!error.message.includes("ERR_ABORTED")) throw error;
  });
  await expect.poll(async () => page.evaluate(async () => ({
    controller: navigator.serviceWorker.controller?.scriptURL ?? null,
    cacheKeys: await caches.keys(),
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
  })).catch(() => null)).toEqual({
    controller: null,
    cacheKeys: ["hydration-test-unrelated"],
    registrations: 0,
  });

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Crie seu grupo" })).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("minlength", "4");
  expect(errors.filter((message) => /hydration|server.rendered|did not match/i.test(message))).toEqual([]);
});
