export type PushLogEntry = {
  id: string;
  title: string;
  body: string;
  url: string;
  image?: string;
  receivedAt: number;
};

const DATABASE_NAME = "gudegi-push";
const STORE_NAME = "notifications";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readPushLogs(limit = 30): Promise<PushLogEntry[]> {
  if (!("indexedDB" in window)) return [];
  const database = await openDatabase();
  try {
    const entries = await new Promise<PushLogEntry[]>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .getAll();
      request.onsuccess = () => resolve(request.result as PushLogEntry[]);
      request.onerror = () => reject(request.error);
    });
    return entries.sort((a, b) => b.receivedAt - a.receivedAt).slice(0, limit);
  } finally {
    database.close();
  }
}

export async function clearPushLogs() {
  if (!("indexedDB" in window)) return;
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readwrite")
        .objectStore(STORE_NAME)
        .clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}
