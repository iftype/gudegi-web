import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("API mutations", () => {
  it("does not declare an empty test request as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ data: { sent: 1 } }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    await api.testPushSubscription("11111111-1111-4111-8111-111111111111");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBeUndefined();
    expect(new Headers(init.headers).has("content-type")).toBe(false);
  });

  it("keeps JSON content type for mutations with a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ data: { id: "11111111-1111-4111-8111-111111111111" } }),
      { status: 201, headers: { "content-type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    await api.createPushSubscription({
      endpoint: "https://push.example.test/device",
      expirationTime: null,
      keys: { p256dh: "p256dh", auth: "auth" }
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("sends alert triggers and the selected category filter together", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);

    await api.savePushPreferences(
      "11111111-1111-4111-8111-111111111111",
      [{
        channelId: "a".repeat(32),
        enabled: true,
        liveStarted: true,
        categoryChanged: true,
        titleChanged: false,
        keywords: ["합방"],
        categoryFilter: {
          allCategories: false,
          categoryKeys: ["ETC:talk"]
        }
      }]
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      channels: [{
        channelId: "a".repeat(32),
        liveStarted: true,
        categoryChanged: true,
        titleChanged: false,
        keywords: ["합방"],
        categoryFilter: {
          allCategories: false,
          categoryKeys: ["ETC:talk"]
        }
      }]
    });
  });

  it("sends only self-hosted access and PWA counters without browsing details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem(
      "trackline-anonymous-id",
      "11111111-1111-4111-8111-111111111111"
    );

    trackEvent("page_view", {
      source: "external.example",
      path: "/private-path",
      channelId: "channel"
    });
    trackEvent("notification_enabled");

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      anonymousId: "11111111-1111-4111-8111-111111111111",
      eventName: "page_view"
    });
  });
});
