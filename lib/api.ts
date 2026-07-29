import type {
  Broadcast,
  MonthlyStreamer,
  PushPreference,
  Streamer
} from "./types";
import type { AnalyticsEventName } from "./analytics";

const API_URL = "/api/public";

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path.replace(/^\/v1/, "")}`, { signal, cache: "no-store" });
  if (!response.ok) {
    throw new Error(response.status === 404 ? "not_found" : "api_unavailable");
  }
  return response.json() as Promise<T>;
}

async function mutate<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path.replace(/^\/v1/, "")}`, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as {
      error?: string;
      data?: { failureStatusCode?: number };
    } | null;
    const error = new Error(
      response.status === 404 ? "not_found" : payload?.error ?? "api_unavailable"
    );
    Object.assign(error, {
      status: response.status,
      failureStatusCode: payload?.data?.failureStatusCode
    });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  streamers: (signal?: AbortSignal) => request<{ data: Streamer[] }>("/v1/streamers", signal),
  broadcasts: (signal?: AbortSignal) => request<{ data: Broadcast[] }>("/v1/broadcasts?limit=100", signal),
  streamerBroadcasts: (channelId: string, signal?: AbortSignal) =>
    request<{ data: Broadcast[] }>(`/v1/streamers/${channelId}/broadcasts?limit=100`, signal),
  monthlyStreamer: (channelId: string, month: string, signal?: AbortSignal) =>
    request<{ data: MonthlyStreamer }>(
      `/v1/streamers/${channelId}/monthly?month=${encodeURIComponent(month)}`,
      signal
    ),
  broadcast: (id: string, signal?: AbortSignal) => request<{ data: Broadcast }>(`/v1/broadcasts/${id}`, signal),
  pushConfig: (signal?: AbortSignal) =>
    request<{ data: { enabled: boolean; publicKey: string } }>("/v1/push/config", signal),
  createPushSubscription: (subscription: PushSubscriptionJSON) =>
    mutate<{ data: { id: string } }>("/v1/push/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription)
    }),
  savePushPreferences: (id: string, channels: PushPreference[]) =>
    mutate<{ ok: true }>(`/v1/push/subscriptions/${id}/preferences`, {
      method: "PUT",
      body: JSON.stringify({
        channels: channels
          .filter((channel) => channel.enabled)
          .map(({ channelId, categoryChanged, titleChanged }) => ({
            channelId,
            categoryChanged,
            titleChanged
          }))
      })
    }),
  deletePushSubscription: (id: string) =>
    mutate<void>(`/v1/push/subscriptions/${id}`, { method: "DELETE" }),
  testPushSubscription: (id: string) =>
    mutate<{ data: { sent: number } }>(`/v1/push/subscriptions/${id}/test`, {
      method: "POST"
    }),
  pushSubscriptionStatus: (id: string, signal?: AbortSignal) =>
    request<{ data: { active: true } }>(`/v1/push/subscriptions/${id}/status`, signal),
  trackAnalytics: (event: {
    anonymousId: string;
    eventName: AnalyticsEventName;
    source?: string;
    channelId?: string;
    path?: string;
  }) => mutate<void>("/v1/analytics/events", {
    method: "POST",
    body: JSON.stringify(event),
    keepalive: true
  }),
  submitFeedback: (feedback: {
    category: "idea" | "bug" | "usability" | "other";
    message: string;
    contact?: string;
    anonymousId?: string;
    website?: string;
  }) => mutate<{ data: { id: number } }>("/v1/feedback", {
    method: "POST",
    body: JSON.stringify(feedback)
  })
};
