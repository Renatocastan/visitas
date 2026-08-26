self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let payload = {};
  try{
    payload = event.data ? event.data.json() : {};
  }catch{
    payload = { body: event.data ? event.data.text() : "Nova notificação do Castan Visitas." };
  }

  const title = payload.title || "Castan Visitas";
  const options = {
    body: payload.body || "Nova atualização no Castan Visitas.",
    icon: payload.icon || "/logo-castan-agenda.jpeg",
    badge: payload.badge || "/logo-castan-agenda.jpeg",
    tag: payload.tag || `castan-push-${Date.now()}`,
    data: {
      url: payload.url || "/",
      visita_id: payload.visita_id || null
    },
    requireInteraction: payload.requireInteraction !== false,
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        try{
          const clientUrl = new URL(client.url);
          const target = new URL(targetUrl, self.location.origin);
          if(clientUrl.origin === target.origin){
            client.navigate?.(target.href);
            return client.focus();
          }
        }catch{}
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
