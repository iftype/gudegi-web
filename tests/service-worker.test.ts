import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("push service worker", () => {
  it("uses a secure streamer profile image in the visible notification", async () => {
    type WorkerListener = (event: unknown) => void;
    type RequestStub = {
      result: unknown;
      onsuccess?: () => void;
    };
    type TransactionStub = {
      objectStore?: () => unknown;
      oncomplete?: () => void;
    };

    const listeners = new Map<string, WorkerListener>();
    const showNotification = vi.fn().mockResolvedValue(undefined);
    const database = {
      objectStoreNames: { contains: () => true },
      transaction: () => {
        const transaction: TransactionStub = {};
        const keysRequest: RequestStub = { result: [] };
        transaction.objectStore = () => ({
          put: vi.fn(),
          delete: vi.fn(),
          getAllKeys: () => {
            queueMicrotask(() => keysRequest.onsuccess?.());
            return keysRequest;
          }
        });
        queueMicrotask(() => transaction.oncomplete?.());
        return transaction;
      },
      close: vi.fn()
    };
    const indexedDB = {
      open: () => {
        const request: RequestStub = { result: database };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      }
    };
    const context = vm.createContext({
      self: {
        location: { origin: "https://gudegi.vercel.app" },
        addEventListener: (name: string, listener: WorkerListener) => {
          listeners.set(name, listener);
        },
        registration: { showNotification },
        clients: { matchAll: vi.fn().mockResolvedValue([]) }
      },
      indexedDB,
      crypto: { randomUUID: () => "notification-id" },
      queueMicrotask,
      URL
    });
    const source = fs.readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
    vm.runInContext(source, context);

    let completion: Promise<unknown> | undefined;
    listeners.get("push")?.({
      data: {
        json: () => ({
          title: "파카 카테고리 변경",
          body: "토크 → 리그 오브 레전드",
          image: "https://example.test/paka.png",
          icon: "https://example.test/paka.png"
        })
      },
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      }
    });
    await completion;

    expect(showNotification).toHaveBeenCalledWith(
      "파카 카테고리 변경",
      expect.objectContaining({
        icon: "https://example.test/paka.png",
        image: "https://example.test/paka.png",
        badge: "/gudegi-icon-192.png"
      })
    );
  });
});
