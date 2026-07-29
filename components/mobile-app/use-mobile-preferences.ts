"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import type { PushPreference, Streamer } from "@/lib/types";

const STORAGE_KEY = "trackline-push-preferences";
const PRIMARY_KEY = "trackline-primary-streamer";
export const PREFERENCE_IMPORT_KEY = "gudegi-import-local-preferences-after-login";

function readGuestPreferences() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as PushPreference[];
  } catch {
    return [];
  }
}

export function useMobilePreferences(streamers: Streamer[], user: AppUser | null) {
  const [stored, setStored] = useState<PushPreference[]>([]);
  const [primaryChannelId, setPrimaryChannelId] = useState("");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPrimaryChannelId(window.localStorage.getItem(PRIMARY_KEY) ?? "");
      if (!user) {
        setStored(readGuestPreferences());
        setReady(true);
        return;
      }
      setReady(false);
      authApi.preferences().then(async (result) => {
        if (cancelled) return;
        window.localStorage.removeItem("gudegi-import-all-after-login");
        let channels = result.data.channels;
        if (window.localStorage.getItem(PREFERENCE_IMPORT_KEY) === "1") {
          const byChannel = new Map(channels.map((item) => [item.channelId, item]));
          for (const guest of readGuestPreferences()) {
            if (!guest.enabled) continue;
            byChannel.set(guest.channelId, guest);
          }
          channels = [...byChannel.values()];
          await authApi.savePreferences(channels);
          window.localStorage.removeItem(PREFERENCE_IMPORT_KEY);
        }
        if (cancelled) return;
        setStored(channels);
        setReady(true);
      }).catch(() => {
        if (cancelled) return;
        setStored([]);
        setReady(true);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [streamers, user]);

  const preferences = useMemo(() => {
    const byChannel = new Map(stored.map((item) => [item.channelId, item]));
    return streamers.map((streamer) => {
      const current = byChannel.get(streamer.channelId);
      return current ? {
        ...current,
        enabled: current.categoryChanged,
        titleChanged: false
      } : {
        channelId: streamer.channelId,
        enabled: false,
        categoryChanged: false,
        titleChanged: false
      };
    });
  }, [stored, streamers]);

  const persist = useCallback(async (next: PushPreference[]) => {
    setStored(next);
    setSaveState("saving");
    try {
      if (user) {
        await authApi.savePreferences(next);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [user]);

  const selectPrimary = useCallback((channelId: string) => {
    setPrimaryChannelId(channelId);
    window.localStorage.setItem(PRIMARY_KEY, channelId);
  }, []);

  const updatePreference = useCallback((
    channelId: string,
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => {
    const next = preferences.map((preference) => {
      if (preference.channelId !== channelId) return preference;
      if (key === "enabled") {
        return checked && !preference.categoryChanged && !preference.titleChanged
          ? { ...preference, enabled: true, categoryChanged: true }
          : { ...preference, enabled: checked };
      }
      const updated = { ...preference, enabled: checked ? true : preference.enabled, [key]: checked };
      return updated.categoryChanged
        ? updated
        : { ...updated, enabled: false, titleChanged: false };
    });
    void persist(next);
  }, [persist, preferences]);

  const updateAll = useCallback((checked: boolean, channelIds?: string[]) => {
    const targets = channelIds ? new Set(channelIds) : null;
    void persist(preferences.map((preference) => targets && !targets.has(preference.channelId)
      ? preference
      : {
          ...preference,
          enabled: checked,
          categoryChanged: checked,
          titleChanged: false
        }));
  }, [persist, preferences]);

  const clear = useCallback((channelIds?: string[]) => {
    const targets = channelIds ? new Set(channelIds) : null;
    return persist(preferences.map((preference) => targets && !targets.has(preference.channelId)
      ? preference
      : {
          ...preference,
          enabled: false,
          categoryChanged: false,
          titleChanged: false
        }));
  }, [persist, preferences]);

  return {
    preferences,
    primaryChannelId,
    selectPrimary,
    updatePreference,
    updateAll,
    clear,
    ready,
    saveState
  };
}
