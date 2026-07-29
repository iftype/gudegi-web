import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePushSubscription } from "@/components/mobile-app/use-push-subscription";
import { api } from "@/lib/api";
import type { PushPreference } from "@/lib/types";

const preferences: PushPreference[] = [{
  channelId: "a".repeat(32),
  enabled: true,
  categoryChanged: true,
  titleChanged: true
}];

function PushProbe() {
  const push = usePushSubscription(preferences);
  return (
    <button onClick={() => void push.enable()}>
      {push.message || "알림 연결"}
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  Reflect.deleteProperty(window, "Notification");
  Reflect.deleteProperty(window, "PushManager");
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("guest push subscription", () => {
  it("registers a public subscription and verifies it with an immediate test push", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "default", requestPermission }
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: function PushManager() {}
    });

    const applicationServerKey = Uint8Array.from([1, 2, 3]).buffer;
    const subscription = {
      endpoint: "https://push.example.test/device",
      expirationTime: null,
      options: { applicationServerKey },
      toJSON: () => ({
        endpoint: "https://push.example.test/device",
        expirationTime: null,
        keys: { p256dh: "p".repeat(64), auth: "a".repeat(24) }
      }),
      getKey: () => null,
      unsubscribe: vi.fn()
    } as unknown as PushSubscription;
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(subscription),
        subscribe: vi.fn()
      }
    } as unknown as ServiceWorkerRegistration;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        ready: Promise.resolve(registration),
        getRegistration: vi.fn().mockResolvedValue(registration)
      }
    });

    vi.spyOn(api, "pushConfig").mockResolvedValue({
      data: { enabled: true, publicKey: "AQID" }
    });
    vi.spyOn(api, "createPushSubscription").mockResolvedValue({
      data: { id: "11111111-1111-4111-8111-111111111111" }
    });
    const savePreferences = vi.spyOn(api, "savePushPreferences").mockResolvedValue({ ok: true });
    const testSubscription = vi.spyOn(api, "testPushSubscription").mockResolvedValue({
      data: { sent: 1 }
    });
    vi.spyOn(api, "pushSubscriptionStatus").mockResolvedValue({ data: { active: true } });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PushProbe />
      </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "알림 연결" }));

    await waitFor(() => expect(testSubscription).toHaveBeenCalledOnce());
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(savePreferences).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      preferences
    );
    expect(await screen.findByText(/테스트 알림을 확인/)).toBeInTheDocument();
    expect(window.localStorage.getItem("trackline-push-subscription-id"))
      .toBe("11111111-1111-4111-8111-111111111111");
  });
});
