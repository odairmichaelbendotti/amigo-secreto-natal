export function getServiceWorkerScript(isProduction: boolean): string {
  if (isProduction) {
    return `
      if ('serviceWorker' in navigator) {
        const register = () => {
          navigator.serviceWorker.register('/sw.js').catch(console.error);
        };
        if (document.readyState === 'complete') {
          register();
        } else {
          window.addEventListener('load', register, { once: true });
        }
      }
    `;
  }

  return `
    if ('serviceWorker' in navigator) {
      (async () => {
        const workerUrl = new URL('/sw.js', window.location.origin).href;
        const wasControlled = navigator.serviceWorker.controller?.scriptURL === workerUrl;
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.filter((registration) => {
          const worker = registration.active || registration.waiting || registration.installing;
          return worker?.scriptURL === workerUrl;
        }).map((registration) => registration.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith('secret-santa-'))
            .map((key) => caches.delete(key)));
        }

        if (wasControlled) window.location.reload();
      })().catch(console.error);
    }
  `;
}
