// Service worker do Meu Cofrin: só recebe e mostra as notificações.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let n = {};
  try { n = event.data ? event.data.json() : {}; } catch (e) { n = { title: 'Meu Cofrin', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(n.title || 'Meu Cofrin', {
    body: n.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: n.tag || undefined,
    renotify: !!n.tag,
    data: { url: n.url || '/' },
    lang: 'pt-BR'
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        try { await c.navigate(url); } catch (e) { /* algumas plataformas não deixam navegar */ }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
