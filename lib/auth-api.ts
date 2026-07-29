import type {
  CategoryFilter,
  PushPreference,
  UnsupportedStreamerRequest
} from "./types";

export type AppUser = {
  channelId: string;
  channelName: string;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/auth${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });
  if (!response.ok) {
    const error = new Error(response.status === 401 ? "unauthorized" : "auth_unavailable");
    Object.assign(error, { status: response.status });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  config: () => request<{
    data: {
      configured: boolean;
      redirectUri: string;
      officialFollowingImportSupported: false;
    };
  }>("/config"),
  begin: () => request<{ data: { authorizationUrl: string } }>("/chzzk/start"),
  complete: (code: string, state: string) => request<{ data: { user: AppUser } }>(
    "/chzzk/callback",
    {
      method: "POST",
      body: JSON.stringify({ code, state })
    }
  ),
  me: () => request<{ data: { user: AppUser } }>("/me"),
  logout: () => request<void>("/logout", { method: "POST" }),
  preferences: () => request<{
    data: {
      channels: PushPreference[];
      categoryFilter: CategoryFilter;
    };
  }>("/preferences"),
  myStreamers: () => request<{
    data: {
      supported: string[];
      unsupportedRequests: UnsupportedStreamerRequest[];
    };
  }>("/my-streamers"),
  saveMyStreamers: (channelIds: string[]) => request<{ ok: true }>("/my-streamers", {
    method: "PUT",
    body: JSON.stringify({ channelIds })
  }),
  savePreferences: (
    preferences: PushPreference[],
    categoryFilter: CategoryFilter
  ) => request<{ ok: true }>("/preferences", {
    method: "PUT",
    body: JSON.stringify({
      channels: preferences
        .filter((preference) => preference.enabled)
        .map(({ channelId, liveStarted, categoryChanged, titleChanged }) => ({
          channelId,
          liveStarted,
          categoryChanged,
          titleChanged
        })),
      categoryFilter
    })
  })
};
