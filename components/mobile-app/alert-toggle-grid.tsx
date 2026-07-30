"use client";

import { Bell, ListFilter } from "lucide-react";
import { useState } from "react";
import type { CategoryFilter, LiveCategory, PushPreference } from "@/lib/types";
import { CategoryFilterSheet } from "./category-filter-sheet";
import styles from "./mobile-app-chzzk-v7.module.css";

export function AlertToggleGrid({
  preference,
  categories,
  onChange,
  onCategoryFilterChange
}: {
  preference: PushPreference;
  categories: LiveCategory[];
  onChange: (key: "enabled", checked: boolean) => void;
  onCategoryFilterChange: (value: CategoryFilter) => void;
}) {
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  return (
    <>
      <div className={styles.alertToggleGrid}>
        <button
          className={preference.enabled ? styles.toggleSelected : ""}
          aria-pressed={preference.enabled}
          onClick={() => onChange("enabled", !preference.enabled)}
        >
          <Bell />
          <span>알림 받기</span>
        </button>
        <button onClick={() => setCategorySheetOpen(true)}>
          <ListFilter />
          <span>카테고리</span>
        </button>
      </div>
      <div className={styles.detailCategoryTags}>
        {preference.categoryFilter.allCategories
          ? <span>전체 카테고리</span>
          : preference.categoryFilter.categoryKeys.map((key) => {
              const category = categories.find((item) => item.categoryKey === key);
              return <span key={key}>{category?.categoryId === "talk"
                ? "저챗"
                : category?.categoryValue ?? key.split(":").slice(1).join(":")}</span>;
            })}
      </div>
      {categorySheetOpen && (
        <CategoryFilterSheet
          categories={categories}
          value={preference.categoryFilter}
          onApply={onCategoryFilterChange}
          onClose={() => setCategorySheetOpen(false)}
        />
      )}
    </>
  );
}
