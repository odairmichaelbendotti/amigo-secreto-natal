import { readFileSync } from "fs";
import { join } from "path";
import { runInNewContext } from "vm";
import { getServiceWorkerScript } from "@/lib/service-worker";

describe("service worker registration", () => {
  function setup(controlled = false) {
    const ownWorker = { active: { scriptURL: "http://localhost:3000/sw.js" }, unregister: jest.fn().mockResolvedValue(true) };
    const otherWorker = { active: { scriptURL: "http://localhost:3000/other/sw.js" }, unregister: jest.fn() };
    const caches = { keys: jest.fn().mockResolvedValue(["secret-santa-v1", "secret-santa-v2-pt-BR", "other-app"]), delete: jest.fn().mockResolvedValue(true) };
    const serviceWorker = {
      controller: controlled ? ownWorker.active : null,
      getRegistrations: jest.fn().mockResolvedValue([ownWorker, otherWorker]),
      register: jest.fn().mockResolvedValue({}),
    };
    const window = { location: { origin: "http://localhost:3000", reload: jest.fn() }, caches, addEventListener: jest.fn() };
    return { ownWorker, otherWorker, context: { URL, navigator: { serviceWorker }, caches, window, document: { readyState: "loading" }, console } };
  }

  it("removes only this application's development worker and caches, then reloads its controlled page", async () => {
    const { ownWorker, otherWorker, context } = setup(true);
    await runInNewContext(getServiceWorkerScript(false), context);
    expect(ownWorker.unregister).toHaveBeenCalledTimes(1);
    expect(otherWorker.unregister).not.toHaveBeenCalled();
    expect(context.caches.delete.mock.calls).toEqual([["secret-santa-v1"], ["secret-santa-v2-pt-BR"]]);
    expect(context.window.location.reload).toHaveBeenCalledTimes(1);
    expect(context.navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it("does not reload an uncontrolled development page", async () => {
    const { context } = setup();
    await runInNewContext(getServiceWorkerScript(false), context);
    expect(context.window.location.reload).not.toHaveBeenCalled();
  });

  it("registers production offline support after load without removing caches", async () => {
    const { context } = setup();
    runInNewContext(getServiceWorkerScript(true), context);
    expect(context.navigator.serviceWorker.register).not.toHaveBeenCalled();
    const [event, register] = context.window.addEventListener.mock.calls[0];
    expect(event).toBe("load");
    register();
    expect(context.navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
    expect(context.caches.delete).not.toHaveBeenCalled();
  });
});

describe("service worker cache policy", () => {
  function setup(path: string, headers: HeadersInit = {}) {
    const handlers: Record<string, (workerEvent: typeof event) => void> = {};
    const cache = { match: jest.fn().mockResolvedValue(undefined), put: jest.fn().mockResolvedValue(undefined) };
    const caches = {
      open: jest.fn().mockResolvedValue(cache),
      keys: jest.fn().mockResolvedValue(["secret-santa-v1", "secret-santa-v3", "other-app"]),
      delete: jest.fn().mockResolvedValue(true),
    };
    const fetch = jest.fn().mockResolvedValue(new Response("fresh"));
    const event = {
      request: { url: `http://localhost:3000${path}`, method: "GET", headers: new Headers(headers), mode: "cors" },
      respondWith: jest.fn(),
      waitUntil: jest.fn(),
    };
    runInNewContext(readFileSync(join(process.cwd(), "public/sw.js"), "utf8"), {
      URL, caches, fetch,
      self: {
        location: { origin: "http://localhost:3000" },
        addEventListener: (name: string, handler: typeof handlers[string]) => { handlers[name] = handler; },
        skipWaiting: jest.fn(),
        clients: { claim: jest.fn() },
      },
    });
    return { handlers, cache, caches, fetch, event };
  }

  it.each(["/api/auth/session", "/_next/data/build/create.json", "/_next/webpack-hmr", "/create?_rsc=abc"])("leaves %s on the network", (path) => {
    const { handlers, event } = setup(path);
    handlers.fetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it("does not intercept RSC requests without a query string", () => {
    const { handlers, event } = setup("/create", { RSC: "1" });
    handlers.fetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it.each([false, true])("caches a Next.js asset only when immutable=%s", async (immutable) => {
    const { handlers, event, fetch, cache } = setup("/_next/static/chunks/app/create/page.js");
    fetch.mockResolvedValue(new Response("fresh", { headers: { "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-store" } }));
    handlers.fetch(event);
    await event.respondWith.mock.calls[0][0];
    expect(cache.put).toHaveBeenCalledTimes(immutable ? 1 : 0);
  });

  it("does not serve a different page's HTML when a navigation is offline", async () => {
    const { handlers, event, fetch } = setup("/create");
    event.request.mode = "navigate";
    fetch.mockRejectedValue(new Error("offline"));
    handlers.fetch(event);
    await expect(event.respondWith.mock.calls[0][0]).rejects.toThrow("offline");
  });

  it("preserves caches belonging to other applications during activation", async () => {
    const { handlers, event, caches } = setup("/");
    handlers.activate(event);
    await event.waitUntil.mock.calls[0][0];
    expect(caches.delete.mock.calls).toEqual([["secret-santa-v1"]]);
  });
});
