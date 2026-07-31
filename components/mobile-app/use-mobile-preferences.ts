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

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keywords = new Map<string, string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const keyword = item.normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 40);
    const normalized = keyword.toLocaleLowerCase("ko-KR");
    if (normalized.length >= 2 && !keywords.has(normalized)) keywords.set(normalized, keyword);
    if (keywords.size >= 10) break;
  }
  return [...keywords.values()];
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
      const legacyEnabled = Boolean(preference.enabled);
      const liveStarted = preference.liveStarted ?? legacyEnabled;
      const categoryChanged = preference.categoryChanged ?? legacyEnabled;
      const titleChanged = Boolean(preference.titleChanged);
      const keywords = normalizeKeywords(preference.keywords);
      return {
        channelId: preference.channelId,
        enabled: Boolean(liveStarted || categoryChanged || titleChanged || keywords.length),
        liveStarted,
        categoryChanged,
        titleChanged,
        keywords,
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
        let channels = result.data.channels.map((preference) => {
          const keywords = normalizeKeywords(preference.keywords);
          return {
            ...preference,
            keywords,
            enabled: Boolean(
              preference.liveStarted
              || preference.categoryChanged
              || preference.titleChanged
              || keywords.length
            ),
            categoryFilter: normalizeCategoryFilter(preference.categoryFilter)
          };
        });
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
        const keywords = normalizeKeywords(current.keywords);
        return {
          ...current,
          keywords,
          enabled: Boolean(
            current.liveStarted
            || current.categoryChanged
            || current.titleChanged
            || keywords.length
          ),
          categoryFilter: normalizeCategoryFilter(current.categoryFilter)
        };
      }
      return {
        channelId: streamer.channelId,
        enabled: false,
        liveStarted: false,
        categoryChanged: false,
        titleChanged: false,
        keywords: [],
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
    key: "enabled" | "liveStarted" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => {
    void persist(preferences.map((preference) => {
      if (preference.channelId !== channelId) return preference;
      if (key === "enabled") {
        return {
          ...preference,
          enabled: checked,
          liveStarted: checked,
          categoryChanged: checked,
          titleChanged: checked,
          ...(checked ? {} : { keywords: [] })
        };
      }
      const next = { ...preference, [key]: checked };
      return {
        ...next,
        enabled: Boolean(
          next.liveStarted
          || next.categoryChanged
          || next.titleChanged
          || next.keywords.length
        )
      };
    }));
  }, [persist, preferences]);

  const updateKeywords = useCallback((channelId: string, keywords: string[]) => {
    const normalized = normalizeKeywords(keywords);
    return persist(preferences.map((preference) => preference.channelId === channelId
      ? {
          ...preference,
          keywords: normalized,
          enabled: Boolean(
            preference.liveStarted
            || preference.categoryChanged
            || preference.titleChanged
            || normalized.length
          )
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

  const updateCategoryFilterAll = useCallback((
    channelIds: string[],
    next: CategoryFilter
  ) => {
    const targets = new Set(channelIds);
    const categoryFilter = normalizeCategoryFilter(next);
    return persist(preferences.map((preference) => targets.has(preference.channelId)
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
          titleChanged: checked,
          ...(checked ? {} : { keywords: [] })
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
          titleChanged: false,
          keywords: []
        }));
  }, [persist, preferences]);

  const enableNewStreamer = useCallback((channelId: string) => {
    return persist(preferences.map((preference) => preference.channelId === channelId
      ? {
          ...preference,
          enabled: true,
          liveStarted: true,
          categoryChanged: true,
          titleChanged: true,
          keywords: [],
          categoryFilter: DEFAULT_CATEGORY_FILTER
        }
      : preference));
  }, [persist, preferences]);

  return {
    preferences,
    primaryChannelId,
    selectPrimary,
    updatePreference,
    updateKeywords,
    updateAll,
    updateCategoryFilter,
    updateCategoryFilterAll,
    enableNewStreamer,
    clear,
    ready,
    saveState
  };
}
