"use client";

import { Bell, ListFilter, Radio, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type {
  CategoryFilter,
  LiveCategory,
  PushPreference,
  Streamer
} from "@/lib/types";
import { CategoryFilterSheet } from "./category-filter-sheet";
import styles from "./mobile-app.module.css";

export function AlertRow({
  streamer,
  preference,
  categories,
  onChange,
  onCategoryFilterChange,
  onRemove
}: {
  streamer: Streamer;
  preference: PushPreference;
  categories: LiveCategory[];
  onChange: (channelId: string, key: "enabled", checked: boolean) => void;
  onCategoryFilterChange: (channelId: string, value: CategoryFilter) => void;
  onRemove?: (channelId: string) => void;
}) {
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const tags = getCategoryTags(preference.categoryFilter, categories);

  return (
    <article className={`${styles.alertRow} ${preference.enabled ? styles.followActive : ""}`}>
      <div className={styles.alertRowContent}>
        <span className={styles.rowAvatar}>
          {streamer.channelImageUrl
            ? <Image
                src={streamer.channelImageUrl}
                alt=""
                width={46}
                height={46}
                sizes="46px"
                loading="lazy"
                style={{ width: "100%", height: "100%" }}
              />
            : streamer.channelName.slice(0, 1)}
          {streamer.isLive && <i />}
        </span>
        <span className={styles.followCopy}>
          <strong>{streamer.channelName}</strong>
          <small>{streamer.isLive
            ? <><Radio /> {streamer.currentCategory || "카테고리 확인 중"}</>
            : `팔로워 순위 #${streamer.trackingRank ?? "-"}`}</small>
        </span>
        {onRemove && <button
          type="button"
          className={styles.rowDeleteIcon}
          aria-label={`${streamer.channelName} 알림 목록에서 삭제`}
          onClick={() => onRemove(streamer.channelId)}
        ><Trash2 /></button>}
        <div className={styles.rowAlertControls}>
          <button
            type="button"
            className={`${styles.rowAlarmToggle} ${preference.enabled ? styles.rowAlarmToggleActive : ""}`}
            aria-pressed={preference.enabled}
            aria-label={`${streamer.channelName} 알림 받기`}
            onClick={() => onChange(streamer.channelId, "enabled", !preference.enabled)}
          >
            <Bell />
            <span>알림 받기</span>
            <i aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.rowCategoryButton}
            aria-label={`${streamer.channelName} 카테고리 선택`}
            onClick={() => setCategorySheetOpen(true)}
          >
            <ListFilter />
            카테고리
          </button>
        </div>
        <div className={styles.rowCategoryTags} aria-label={`${streamer.channelName} 선택 카테고리`}>
          {tags.map((tag) => <span key={tag.key}>{tag.label}</span>)}
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
