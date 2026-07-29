"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import type { CategoryFilter, PushPreference, Streamer } from "@/lib/types";

const STORAGE_KEY = "trackline-push-preferences";
const LEGACY_CATEGORY_FILTER_KEY = "gudegi-category-filter";
const PRIMARY_KEY = "trackline-primary-streamer";
export const PREFERENCE_IMPORT_KEY = "gudegi-import-local-preferences-after-login";
const DEFAULT_CATEGORY_FILTER: CategoryFilter = {
  allCategories: true,
  categoryKeys: []
};

function normalizeCategoryFilter(
  value: Partial<CategoryFilter> | null | undefined,
  fallback = DEFAULT_CATEGORY_FILTER
): CategoryFilter {
  if (!value || !Array.isArray(value.categoryKeys)) return fallback;
  if (value.allCategories !== false || value.categoryKeys.length === 0) {
    return DEFAULT_CATEGORY_FILTER;
  }
  return {
    allCategories: false,
    categoryKeys: [...new Set(
      value.categoryKeys.filter((key): key is string => typeof key === "string")
    )]
  };
}

function readLegacyCategoryFilter() {
  try {
    return normalizeCategoryFilter(JSON.parse(
      window.localStorage.getItem(LEGACY_CATEGORY_FILTER_KEY) ?? "null"
    ) as Partial<CategoryFilter> | null);
  } catch {
    return DEFAULT_CATEGORY_FILTER;
  }
}

function readGuestPreferences() {
  try {
    const legacyCategoryFilter = readLegacyCategoryFilter();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as Array<
      Partial<PushPreference> & Pick<PushPreference, "channelId">
    >;
    return stored.map((preference) => {
      const enabled = Boolean(
        preference.enabled || preference.liveStarted || preference.categoryChanged
      );
      return {
        channelId: preference.channelId,
        enabled,
        liveStarted: enabled,
        categoryChanged: enabled,
        titleChanged: false,
        categoryFilter: normalizeCategoryFilter(
          preference.categoryFilter,
          legacyCategoryFilter
        )
      };
    });
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
        let channels = result.data.channels.map((preference) => ({
          ...preference,
          enabled: Boolean(preference.enabled),
          liveStarted: Boolean(preference.enabled),
          categoryChanged: Boolean(preference.enabled),
          titleChanged: false,
          categoryFilter: normalizeCategoryFilter(preference.categoryFilter)
        }));
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
  }, [user]);

  const preferences = useMemo(() => {
    const byChannel = new Map(stored.map((item) => [item.channelId, item]));
    return streamers.map((streamer) => {
      const current = byChannel.get(streamer.channelId);
      if (current) {
        return {
          ...current,
          enabled: Boolean(current.enabled),
          liveStarted: Boolean(current.enabled),
          categoryChanged: Boolean(current.enabled),
          titleChanged: false,
          categoryFilter: normalizeCategoryFilter(current.categoryFilter)
        };
      }
      return {
        channelId: streamer.channelId,
        enabled: false,
        liveStarted: false,
        categoryChanged: false,
        titleChanged: false,
        categoryFilter: DEFAULT_CATEGORY_FILTER
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
    key: "enabled",
    checked: boolean
  ) => {
    void persist(preferences.map((preference) => preference.channelId === channelId
      ? {
          ...preference,
          enabled: checked,
          liveStarted: checked,
          categoryChanged: checked,
          titleChanged: false
        }
      : preference));
  }, [persist, preferences]);

  const updateCategoryFilter = useCallback((
    channelId: string,
    next: CategoryFilter
  ) => {
    const categoryFilter = normalizeCategoryFilter(next);
    return persist(preferences.map((preference) => preference.channelId === channelId
      ? { ...preference, categoryFilter }
      : preference));
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
          titleChanged: false,
          categoryFilter: DEFAULT_CATEGORY_FILTER
        }
      : preference));
  }, [persist, preferences]);

  return {
    preferences,
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
