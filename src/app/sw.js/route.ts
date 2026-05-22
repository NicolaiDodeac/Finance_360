/**
 * Finance 360 is not a PWA. Browsers (or a stale registration on localhost)
 * may still request /sw.js — return a script that unregisters any old worker.
 */
const SW_BODY = `
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.claim())
  );
});
`.trim();

export function GET() {
  return new Response(SW_BODY, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
