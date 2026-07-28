self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "방송 정보가 변경되었습니다." };
  }
  const title = payload.title || "TRACKLINE 변경 알림";
  const channelId = typeof payload.channelId === "string" && /^[a-f0-9]{32}$/i.test(payload.channelId)
    ? payload.channelId
    : null;
  const targetPath = channelId
    ? `/open/chzzk/${encodeURIComponent(channelId)}?source=push`
    : payload.url || "/";
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || "방송 정보가 변경되었습니다.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "trackline-notification",
    data: { url: targetPath }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const candidateUrl = new URL(event.notification.data?.url || "/", self.location.origin);
  const targetUrl = candidateUrl.origin === self.location.origin
    ? candidateUrl.href
    : self.location.origin;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(targetUrl);
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});
