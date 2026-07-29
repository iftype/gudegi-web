self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "방송 정보가 변경되었습니다." };
  }
  const title = payload.title || "구데기 변경 알림";
  const channelId = typeof payload.channelId === "string" && /^[a-f0-9]{32}$/i.test(payload.channelId)
    ? payload.channelId
    : null;
  const targetPath = channelId
    ? `/open/chzzk/${encodeURIComponent(channelId)}?source=push`
    : payload.url || "/";
  const body = payload.body || "방송 정보가 변경되었습니다.";
  const icon = safeNotificationImage(payload.icon, "/gudegi-icon-192.png");
  const image = safeNotificationImage(payload.image);
  const logId = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  event.waitUntil(Promise.all([
    saveNotificationLog({
      id: `${Date.now()}-${logId}`,
      title,
      body,
      url: targetPath,
      image,
      receivedAt: Date.now()
    }).catch(() => undefined),
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/gudegi-icon-192.png",
      ...(image ? { image } : {}),
      tag: payload.tag || "gudegi-notification",
      data: { url: targetPath }
    }),
    notifyOpenClients()
  ]));
});

function safeNotificationImage(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin === self.location.origin || url.protocol === "https:") return url.href;
  } catch {
    // Invalid remote image URLs fall back to the app icon.
  }
  return fallback;
}

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

function openLogDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gudegi-push", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("notifications")) {
        database.createObjectStore("notifications", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveNotificationLog(entry) {
  const database = await openLogDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("notifications", "readwrite");
      const store = transaction.objectStore("notifications");
      store.put(entry);
      const allKeys = store.getAllKeys();
      allKeys.onsuccess = () => {
        const overflow = allKeys.result.length - 50;
        if (overflow > 0) allKeys.result.slice(0, overflow).forEach((key) => store.delete(key));
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

async function notifyOpenClients() {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: "GUDEGI_PUSH_RECEIVED" }));
}
