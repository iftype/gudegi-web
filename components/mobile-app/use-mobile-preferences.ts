"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import type { CategoryFilter, PushPreference, Streamer } from "@/lib/types";

const STORAGE_KEY = "trackline-push-preferences";
const CATEGORY_FILTER_KEY = "gudegi-category-filter";
const PRIMARY_KEY = "trackline-primary-streamer";
export const PREFERENCE_IMPORT_KEY = "gudegi-import-local-preferences-after-login";
const DEFAULT_CATEGORY_FILTER: CategoryFilter = {
  allCategories: true,
  categoryKeys: []
};

function readGuestPreferences() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as Array<
      Partial<PushPreference> & Pick<PushPreference, "channelId">
    >;
    return stored.map((preference) => ({
      channelId: preference.channelId,
      enabled: Boolean(preference.enabled),
      liveStarted: Boolean(preference.liveStarted),
      categoryChanged: Boolean(preference.categoryChanged),
      titleChanged: false
    }));
  } catch {
    return [];
  }
}

function readGuestCategoryFilter(): CategoryFilter {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(CATEGORY_FILTER_KEY) ?? "null"
    ) as Partial<CategoryFilter> | null;
    if (!stored || !Array.isArray(stored.categoryKeys)) return DEFAULT_CATEGORY_FILTER;
    return {
      allCategories: stored.allCategories !== false,
      categoryKeys: stored.categoryKeys.filter((key): key is string => typeof key === "string")
    };
  } catch {
    return DEFAULT_CATEGORY_FILTER;
  }
}

export function useMobilePreferences(streamers: Streamer[], user: AppUser | null) {
  const [stored, setStored] = useState<PushPreference[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(DEFAULT_CATEGORY_FILTER);
  const [primaryChannelId, setPrimaryChannelId] = useState("");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPrimaryChannelId(window.localStorage.getItem(PRIMARY_KEY) ?? "");
      if (!user) {
        setStored(readGuestPreferences());
        setCategoryFilter(readGuestCategoryFilter());
        setReady(true);
        return;
      }
      setReady(false);
      authApi.preferences().then(async (result) => {
        if (cancelled) return;
        window.localStorage.removeItem("gudegi-import-all-after-login");
        let channels = result.data.channels.map((preference) => ({
          ...preference,
          liveStarted: Boolean(preference.liveStarted)
        }));
        let nextCategoryFilter = result.data.categoryFilter ?? DEFAULT_CATEGORY_FILTER;
        if (window.localStorage.getItem(PREFERENCE_IMPORT_KEY) === "1") {
          const byChannel = new Map(channels.map((item) => [item.channelId, item]));
          for (const guest of readGuestPreferences()) {
            if (!guest.enabled) continue;
            byChannel.set(guest.channelId, guest);
          }
          channels = [...byChannel.values()];
          const guestCategoryFilter = readGuestCategoryFilter();
          if (!guestCategoryFilter.allCategories || guestCategoryFilter.categoryKeys.length) {
            nextCategoryFilter = guestCategoryFilter;
          }
          await authApi.savePreferences(channels, nextCategoryFilter);
          window.localStorage.removeItem(PREFERENCE_IMPORT_KEY);
        }
        if (cancelled) return;
        setStored(channels);
        setCategoryFilter(nextCategoryFilter);
        setReady(true);
      }).catch(() => {
        if (cancelled) return;
        setStored([]);
        setCategoryFilter(DEFAULT_CATEGORY_FILTER);
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
        enabled: current.liveStarted || current.categoryChanged,
        liveStarted: Boolean(current.liveStarted),
        titleChanged: false
      } : {
        channelId: streamer.channelId,
        enabled: false,
        liveStarted: false,
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
        await authApi.savePreferences(next, categoryFilter);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [categoryFilter, user]);

  const updateCategoryFilter = useCallback(async (next: CategoryFilter) => {
    const normalized = next.allCategories
      ? DEFAULT_CATEGORY_FILTER
      : {
          allCategories: false,
          categoryKeys: [...new Set(next.categoryKeys)]
        };
    setCategoryFilter(normalized);
    setSaveState("saving");
    try {
      if (user) {
        await authApi.savePreferences(preferences, normalized);
      } else {
        window.localStorage.setItem(CATEGORY_FILTER_KEY, JSON.stringify(normalized));
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [preferences, user]);

  const selectPrimary = useCallback((channelId: string) => {
    setPrimaryChannelId(channelId);
    window.localStorage.setItem(PRIMARY_KEY, channelId);
  }, []);

  const updatePreference = useCallback((
    channelId: string,
    key: "enabled" | "liveStarted" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => {
    const next = preferences.map((preference) => {
      if (preference.channelId !== channelId) return preference;
      if (key === "enabled") {
        return checked && !preference.liveStarted && !preference.categoryChanged
          ? {
              ...preference,
              enabled: true,
              liveStarted: true,
              categoryChanged: true
            }
          : { ...preference, enabled: checked };
      }
      const updated = { ...preference, enabled: checked ? true : preference.enabled, [key]: checked };
      return updated.liveStarted || updated.categoryChanged
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
          liveStarted: checked,
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
          liveStarted: false,
          categoryChanged: false,
          titleChanged: false
        }));
  }, [persist, preferences]);

  const enableNewStreamer = useCallback((channelId: string) => {
    return persist(preferences.map((preference) => preference.channelId === channelId
      ? {
          ...preference,
          enabled: true,
          liveStarted: true,
          categoryChanged: true,
          titleChanged: false
        }
      : preference));
  }, [persist, preferences]);

  return {
    preferences,
    categoryFilter,
    primaryChannelId,
    selectPrimary,
    updatePreference,
    updateAll,
    updateCategoryFilter,
    enableNewStreamer,
    clear,
    ready,
    saveState
  };
}
