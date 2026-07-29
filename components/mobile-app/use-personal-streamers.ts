"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import type { Streamer, UnsupportedStreamerRequest } from "@/lib/types";

const STORAGE_KEY = "gudegi-my-streamers";
const UNSUPPORTED_KEY = "gudegi-unsupported-streamers";
const LEGACY_PREFERENCES_KEY = "trackline-push-preferences";
export const STREAMER_IMPORT_KEY = "gudegi-import-local-streamers-after-login";

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

export function usePersonalStreamers(streamers: Streamer[], user: AppUser | null) {
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [unsupported, setUnsupported] = useState<UnsupportedStreamerRequest[]>([]);
  const [ready, setReady] = useState(false);
  const availableChannelIds = useMemo(
    () => streamers.map((streamer) => streamer.channelId).sort().join(","),
    [streamers]
  );

  const load = useCallback(async () => {
    setReady(false);
    if (user) {
      try {
        const result = await authApi.myStreamers();
        let supported = result.data.supported;
        if (window.localStorage.getItem(STREAMER_IMPORT_KEY) === "1") {
          const available = new Set(availableChannelIds.split(",").filter(Boolean));
          const guest = readJson<string[]>(STORAGE_KEY, []).filter((channelId) => available.has(channelId));
          supported = [...new Set([...supported, ...guest])];
          await authApi.saveMyStreamers(supported);
          window.localStorage.removeItem(STREAMER_IMPORT_KEY);
        }
        setChannelIds(supported);
        setUnsupported(result.data.unsupportedRequests);
      } catch {
        setChannelIds([]);
        setUnsupported([]);
      }
      setReady(true);
      return;
    }
    const existing = readJson<string[]>(STORAGE_KEY, []);
    if (window.localStorage.getItem(STORAGE_KEY) === null) {
      const legacy = readJson<Array<{ channelId: string; enabled?: boolean }>>(
        LEGACY_PREFERENCES_KEY,
        []
      ).filter((item) => item.enabled).map((item) => item.channelId);
      setChannelIds(legacy);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    } else {
      setChannelIds(existing);
    }
    setUnsupported(readJson<UnsupportedStreamerRequest[]>(UNSUPPORTED_KEY, []));
    setReady(true);
  }, [availableChannelIds, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const persist = useCallback(async (next: string[]) => {
    const unique = [...new Set(next)];
    setChannelIds(unique);
    if (user) await authApi.saveMyStreamers(unique);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  }, [user]);

  const add = useCallback((channelId: string) => {
    void persist([...channelIds, channelId]);
  }, [channelIds, persist]);

  const remove = useCallback((channelId: string) => {
    void persist(channelIds.filter((item) => item !== channelId));
  }, [channelIds, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  const rememberUnsupported = useCallback((request: UnsupportedStreamerRequest) => {
    if (user) {
      void load();
      return;
    }
    const next = [
      request,
      ...unsupported.filter((item) => item.channelId !== request.channelId)
    ];
    setUnsupported(next);
    window.localStorage.setItem(UNSUPPORTED_KEY, JSON.stringify(next));
  }, [load, unsupported, user]);

  const supportedStreamers = useMemo(() => {
    const byId = new Map(streamers.map((streamer) => [streamer.channelId, streamer]));
    return channelIds.map((channelId) => byId.get(channelId)).filter(Boolean) as Streamer[];
  }, [channelIds, streamers]);

  return {
    ready,
    channelIds,
    supportedStreamers,
    unsupported,
    add,
    remove,
    clear,
    rememberUnsupported,
    refresh: load
  };
}
