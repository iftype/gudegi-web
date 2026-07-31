"use client";

import {
  Bell,
  CheckCircle2,
  CloudDownload,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AppUser } from "@/lib/auth-api";
import type {
  CategoryFilter,
  LiveCategory,
  PushPreference,
  Streamer
} from "@/lib/types";
import styles from "./mobile-app-chzzk-v7.module.css";
import { AlertRow } from "./alert-row";
import { CategoryFilterSheet } from "./category-filter-sheet";
import { UnsupportedList } from "./unsupported-list";

export function FollowTab({
  streamers,
  preferences,
  user,
  pushActive,
  pushBusy,
  categories = [],
  onConnect,
  onChange,
  onChangeAll,
  onCategoryFilterChange = () => undefined,
  onCategoryFilterChangeAll = () => undefined,
  onKeywordsChange = () => undefined,
  onAdd = () => undefined,
  onImport = () => undefined,
  onClearAll = () => undefined,
  onRemove,
  unsupportedRequests = [],
  onSuggest = () => undefined,
  onSuggestUnsupported = async () => undefined,
  onOpenDetail
}: {
  streamers: Streamer[];
  preferences: PushPreference[];
  user: AppUser | null;
  pushActive: boolean;
  pushBusy: boolean;
  categories?: LiveCategory[];
  onConnect: () => void;
  onChange: (
    channelId: string,
    key: "enabled" | "liveStarted" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
  onChangeAll: (checked: boolean) => void;
  onCategoryFilterChange?: (channelId: string, value: CategoryFilter) => void;
  onCategoryFilterChangeAll?: (value: CategoryFilter) => void;
  onKeywordsChange?: (channelId: string, keywords: string[]) => void;
  onAdd?: () => void;
  onImport?: () => void;
  onClearAll?: () => void;
  onRemove?: (channelId: string) => void;
  unsupportedRequests?: import("@/lib/types").UnsupportedStreamerRequest[];
  onSuggest?: () => void;
  onSuggestUnsupported?: (streamerName: string) => Promise<void>;
  onOpenDetail?: (channelId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [allCategorySheetOpen, setAllCategorySheetOpen] = useState(false);
  const preferenceByChannel = useMemo(
    () => new Map(preferences.map((item) => [item.channelId, item])),
    [preferences]
  );
  const visible = useMemo(() => streamers
    .filter((streamer) => streamer.channelName.toLowerCase().includes(query.trim().toLowerCase()))
    .map((streamer, index) => ({ streamer, index }))
    .sort((left, right) => Number(right.streamer.isLive) - Number(left.streamer.isLive)
      || left.index - right.index)
    .map(({ streamer }) => streamer), [query, streamers]);
  const enabledCount = preferences.filter((item) => item.enabled).length;
  const allSelected = preferences.length > 0 && enabledCount === preferences.length;
  const commonCategoryFilter = useMemo(
    () => getCommonCategoryFilter(preferences),
    [preferences]
  );

  return (
    <section className={styles.tabScroll}>
      <header className={`${styles.tabIntro} ${styles.followIntro}`}>
        <div className={styles.followIntroCopy}>
          <span>MY ALERTS</span>
          <h1>알림 관리</h1>
          <p>{user
            ? `계정에 저장한 ${enabledCount}명의 맞춤 알림을 관리합니다.`
            : `이 기기에 저장한 ${enabledCount}명의 맞춤 알림을 관리합니다.`}</p>
        </div>
        <button
          className={`${styles.followPushBanner} ${!pushActive ? styles.followPushBannerAttention : ""}`}
          disabled={pushBusy}
          onClick={onConnect}
        >
          {pushBusy ? <RefreshCw className={styles.spinning} /> : pushActive ? <CheckCircle2 /> : <Bell />}
          <strong>{pushActive ? "기기 알림 연결됨" : "이 기기에서 알림 받기"}</strong>
        </button>
      </header>
      {(!user || streamers.length > 0) && (
        <div className={styles.followListManagement}>
          {!user && (
            <button className={styles.followImportButton} onClick={onImport}>
              <CloudDownload />팔로우 불러오기
            </button>
          )}
          {streamers.length > 0 && (
            <button className={styles.clearAllAlertsButton} onClick={onClearAll}>
              <Trash2 />알림 목록 전체삭제
            </button>
          )}
        </div>
      )}
      <div className={styles.followTools}>
        <label className={styles.inlineSearch}>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="스트리머 검색"
          />
        </label>
        <button
          type="button"
          className={styles.allCategoryFilterButton}
          aria-label="전체 카테고리 필터"
          disabled={!preferences.length}
          onClick={() => setAllCategorySheetOpen(true)}
        >
          <ListFilter />
          <span>전체 필터</span>
        </button>
        <label className={styles.selectAll}>
          <span><strong>전체 선택</strong><small>{enabledCount}/{preferences.length}</small></span>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onChangeAll(event.target.checked)}
          />
          <i aria-hidden="true" />
        </label>
      </div>
      <div className={styles.followList}>
        {visible.map((streamer) => {
          const preference = preferenceByChannel.get(streamer.channelId)!;
          return (
            <AlertRow
              key={streamer.channelId}
              streamer={streamer}
              preference={preference}
              categories={categories}
              onChange={onChange}
              onCategoryFilterChange={onCategoryFilterChange}
              onKeywordsChange={onKeywordsChange}
              onRemove={onRemove}
              onOpenDetail={onOpenDetail}
            />
          );
        })}
      </div>
      {!streamers.length && <p className={styles.personalEmpty}>내 알림 목록이 비어 있습니다.<br />스트리머 탭에서 검색해 추가하거나 원하는 스트리머를 제안해 주세요.</p>}
      <div className={styles.personalListActions}>
        <button onClick={onAdd}><Plus />알림 목록에 추가</button>
        <button onClick={onSuggest}><Send />스트리머 제안</button>
      </div>
      <UnsupportedList
        requests={unsupportedRequests}
        onSuggest={onSuggest}
        onSuggestUnsupported={onSuggestUnsupported}
      />
      {allCategorySheetOpen && (
        <CategoryFilterSheet
          categories={categories}
          value={commonCategoryFilter}
          scope="all"
          onApply={onCategoryFilterChangeAll}
          onClose={() => setAllCategorySheetOpen(false)}
        />
      )}
    </section>
  );
}

function getCommonCategoryFilter(preferences: PushPreference[]): CategoryFilter {
  const fallback: CategoryFilter = { allCategories: true, categoryKeys: [] };
  const first = preferences[0]?.categoryFilter;
  if (!first) return fallback;
  const keys = [...first.categoryKeys].sort();
  const matches = preferences.every((preference) => (
    preference.categoryFilter.allCategories === first.allCategories
    && JSON.stringify([...preference.categoryFilter.categoryKeys].sort()) === JSON.stringify(keys)
  ));
  return matches ? first : fallback;
}
