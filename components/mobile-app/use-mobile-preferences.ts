"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import type { PushPreference, Streamer } from "@/lib/types";

const STORAGE_KEY = "trackline-push-preferences";
const PRIMARY_KEY = "trackline-primary-streamer";

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
      authApi.preferences().then((result) => {
        if (cancelled) return;
        setStored(result.data.channels);
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
  }, [user]);

  const preferences = useMemo(() => {
    const byChannel = new Map(stored.map((item) => [item.channelId, item]));
    return streamers.map((streamer) => {
      const current = byChannel.get(streamer.channelId);
      return current ? {
        ...current,
        enabled: current.enabled ?? (current.categoryChanged || current.titleChanged)
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
      return updated.categoryChanged || updated.titleChanged
        ? updated
        : { ...updated, enabled: false };
    });
    void persist(next);
  }, [persist, preferences]);

  return {
    preferences,
    primaryChannelId,
    selectPrimary,
    updatePreference,
    ready,
    saveState
  };
}
