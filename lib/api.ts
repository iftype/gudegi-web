import type { Broadcast, RepresentativeMessage, Streamer, TimelineBucket } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { signal, cache: "no-store" });
  if (!response.ok) {
    throw new Error(response.status === 404 ? "not_found" : "api_unavailable");
  }
  return response.json() as Promise<T>;
}

export const api = {
  streamers: (signal?: AbortSignal) => request<{ data: Streamer[] }>("/v1/streamers", signal),
  broadcasts: (signal?: AbortSignal) => request<{ data: Broadcast[] }>("/v1/broadcasts?limit=100", signal),
  streamerBroadcasts: (channelId: string, signal?: AbortSignal) =>
    request<{ data: Broadcast[] }>(`/v1/streamers/${channelId}/broadcasts?limit=100`, signal),
  broadcast: (id: string, signal?: AbortSignal) => request<{ data: Broadcast }>(`/v1/broadcasts/${id}`, signal),
  timeline: (id: string, resolution: number, signal?: AbortSignal) =>
    request<{ data: TimelineBucket[] }>(`/v1/broadcasts/${id}/timeline?resolution=${resolution}`, signal),
  messages: (id: string, bucket: number, resolution: number, signal?: AbortSignal) =>
    request<{ data: RepresentativeMessage[] }>(
      `/v1/broadcasts/${id}/messages?bucket=${bucket}&resolution=${resolution}`,
      signal
    ),
  search: (id: string, query: string, signal?: AbortSignal) =>
    request<{ data: RepresentativeMessage[]; sampled: boolean }>(
      `/v1/broadcasts/${id}/search?q=${encodeURIComponent(query)}`,
      signal
    )
};
