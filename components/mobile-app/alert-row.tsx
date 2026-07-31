"use client";

import {
  Bell,
  BellRing,
  Clock3,
  Ellipsis,
  ListFilter,
  ListChecks,
  Trash2
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { formatDuration } from "@/lib/format";
import type {
  AlertRules,
  CategoryFilter,
  LiveCategory,
  PushPreference,
  Streamer
} from "@/lib/types";
import { AlertRuleSheet } from "./alert-rule-sheet";
import { CategoryFilterSheet } from "./category-filter-sheet";
import styles from "./mobile-app-chzzk-v7.module.css";

export function AlertRow({
  streamer,
  preference,
  categories,
  onChange,
  onCategoryFilterChange,
  onRulesChange,
  onRemove,
  onOpenDetail
}: {
  streamer: Streamer;
  preference: PushPreference;
  categories: LiveCategory[];
  onChange: (
    channelId: string,
    key: "enabled" | "liveStarted" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
  onCategoryFilterChange: (channelId: string, value: CategoryFilter) => void;
  onRulesChange: (channelId: string, value: AlertRules) => void;
  onRemove?: (channelId: string) => void;
  onOpenDetail?: (channelId: string) => void;
}) {
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [ruleSheetOpen, setRuleSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tags = getCategoryTags(preference.categoryFilter, categories);

  return (
    <article className={`${styles.alertRow} ${preference.enabled ? styles.followActive : ""}`}>
      <div className={styles.alertRowContent}>
        <span className={styles.rowAvatarWrap}>
          {streamer.isLive ? (
            <a
              className={styles.rowAvatar}
              href={`/open/chzzk/${encodeURIComponent(streamer.channelId)}`}
              aria-label={`${streamer.channelName} 방송 보기`}
            >
              {streamer.channelImageUrl
                ? <Image
                    src={streamer.channelImageUrl}
                    alt=""
                    width={42}
                    height={42}
                    sizes="42px"
                    loading="lazy"
                    style={{ width: "100%", height: "100%" }}
                  />
                : streamer.channelName.slice(0, 1)}
            </a>
          ) : (
            <span className={styles.rowAvatar}>
            {streamer.channelImageUrl
              ? <Image
                  src={streamer.channelImageUrl}
                  alt=""
                  width={42}
                  height={42}
                  sizes="42px"
                  loading="lazy"
                  style={{ width: "100%", height: "100%" }}
                />
              : streamer.channelName.slice(0, 1)}
            </span>
          )}
          {streamer.isLive && <b>LIVE</b>}
        </span>
        <div className={styles.rowMain}>
          <div className={styles.rowTitleLine}>
            <div className={styles.rowIdentity}>
              {onOpenDetail ? (
                <button
                  type="button"
                  className={styles.rowNameButton}
                  onClick={() => onOpenDetail(streamer.channelId)}
                >
                  {streamer.channelName}
                </button>
              ) : <strong>{streamer.channelName}</strong>}
              {streamer.isLive && streamer.activeBroadcastStartedAt && (
                <span className={styles.rowBroadcastTime}>
                  <Clock3 />
                  <span suppressHydrationWarning>
                    {formatDuration(streamer.activeBroadcastStartedAt, null)}
                  </span>
                </span>
              )}
            </div>
            <div className={styles.rowHeaderActions}>
              <button
                type="button"
                className={`${styles.rowAlarmToggle} ${preference.enabled ? styles.rowAlarmToggleActive : ""}`}
                aria-pressed={preference.enabled}
                aria-label={`${streamer.channelName} 알림 받기`}
                onClick={() => onChange(streamer.channelId, "enabled", !preference.enabled)}
              >
                {preference.enabled ? <BellRing /> : <Bell />}
              </button>
              <button
                type="button"
                className={styles.rowRuleIconButton}
                aria-expanded={ruleSheetOpen}
                aria-label={`${streamer.channelName} 알림 조건`}
                onClick={() => setRuleSheetOpen(true)}
              >
                <ListChecks />
              </button>
              {onRemove && (
                <div
                  className={styles.rowMoreMenu}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
                  }}
                >
                  <button
                    type="button"
                    className={styles.rowMoreButton}
                    aria-label={`${streamer.channelName} 더보기`}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    <Ellipsis />
                  </button>
                  {menuOpen && (
                    <button
                      type="button"
                      className={styles.rowDeleteMenuItem}
                      aria-label={`${streamer.channelName} 알림 목록에서 삭제`}
                      onClick={() => onRemove(streamer.channelId)}
                    >
                      <Trash2 />
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={styles.rowCategoryBar}>
            <button
              type="button"
              className={styles.rowCategoryButton}
              aria-label={`${streamer.channelName} 카테고리 선택`}
              onClick={() => setCategorySheetOpen(true)}
            >
              <ListFilter />
              카테고리
            </button>
            <div className={styles.rowCategoryTags} aria-label={`${streamer.channelName} 선택 카테고리`}>
              {tags.map((tag) => <span key={tag.key}>{tag.label}</span>)}
            </div>
          </div>
        </div>
      </div>
      {categorySheetOpen && (
        <CategoryFilterSheet
          categories={categories}
          value={preference.categoryFilter}
          onApply={(value) => onCategoryFilterChange(streamer.channelId, value)}
          onClose={() => setCategorySheetOpen(false)}
        />
      )}
      {ruleSheetOpen && (
        <AlertRuleSheet
          streamerName={streamer.channelName}
          value={{
            liveStarted: preference.liveStarted,
            categoryChanged: preference.categoryChanged,
            titleChanged: preference.titleChanged,
            keywords: preference.keywords
          }}
          onApply={(value) => onRulesChange(streamer.channelId, value)}
          onClose={() => setRuleSheetOpen(false)}
        />
      )}
    </article>
  );
}

function getCategoryTags(filter: CategoryFilter, categories: LiveCategory[]) {
  if (filter.allCategories) return [{ key: "all", label: "전체 카테고리" }];
  const byKey = new Map(categories.map((category) => [category.categoryKey, category]));
  return filter.categoryKeys.map((key) => {
    const category = byKey.get(key);
    return {
      key,
      label: category?.categoryId === "talk"
        ? "저챗"
        : category?.categoryValue ?? key.split(":").slice(1).join(":")
    };
  });
}
