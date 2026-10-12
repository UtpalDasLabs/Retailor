/*
 * Retires the offline cache at the old address. The app moved to https://retailor.utpaldas.com;
 * an installed copy would otherwise keep serving the old build from cache and
 * never reach the handover page. This worker clears every cache, unregisters
 * itself and reloads open windows, which then load the handover page.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url))),
  );
});
