"use client";

import { Check, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import type { CategoryFilter, LiveCategory } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function CategoryFilterSheet({
  categories,
  value,
  onApply,
  onClose
}: {
  categories: LiveCategory[];
  value: CategoryFilter;
  onApply: (value: CategoryFilter) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<CategoryFilter>(value);
  const selected = useMemo(() => new Set(draft.categoryKeys), [draft.categoryKeys]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalized) return categories;
    return categories.filter((category) =>
      category.categoryValue.toLocaleLowerCase("ko-KR").includes(normalized)
      || category.categoryId.toLocaleLowerCase("ko-KR").includes(normalized)
      || (category.categoryId === "talk" && "저챗".includes(normalized))
    );
  }, [categories, query]);

  function toggleCategory(categoryKey: string) {
    if (draft.allCategories) {
      setDraft({ allCategories: false, categoryKeys: [categoryKey] });
      return;
    }
    const next = new Set(draft.categoryKeys);
    if (next.has(categoryKey)) next.delete(categoryKey);
    else next.add(categoryKey);
    setDraft(next.size
      ? { allCategories: false, categoryKeys: [...next] }
      : { allCategories: true, categoryKeys: [] });
  }

  return createPortal(
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={`${styles.sheet} ${styles.categoryFilterSheet}`}
        role="dialog"
        aria-modal="true"
        aria-label="카테고리 태그 선택"
      >
        <div className={styles.sheetHandle} />
        <header className={styles.sheetHeader}>
          <div><span>CHZZK CATEGORY</span><h2>카테고리 태그 선택</h2></div>
          <button onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        <div className={styles.categoryFilterTools}>
          <button
            type="button"
            className={draft.allCategories ? styles.categoryFilterSelected : ""}
            aria-pressed={draft.allCategories}
            onClick={() => setDraft({ allCategories: true, categoryKeys: [] })}
          >
            <span><strong>전체 체크</strong><small>모든 방송 카테고리 알림</small></span>
            <i>{draft.allCategories && <Check />}</i>
          </button>
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="카테고리 검색"
            />
          </label>
        </div>
        <div className={styles.categoryChoices}>
          {visible.map((category) => {
            const checked = !draft.allCategories && selected.has(category.categoryKey);
            return (
              <button
                type="button"
                key={category.categoryKey}
                className={checked ? styles.categoryChoiceSelected : ""}
                aria-pressed={checked}
                onClick={() => toggleCategory(category.categoryKey)}
              >
                <span>
                  <strong>{category.categoryId === "talk" ? "저챗" : category.categoryValue}</strong>
                  <small>{categoryTypeLabel(category.categoryType)} · 라이브 {category.openLiveCount.toLocaleString()}개</small>
                </span>
                <i>{checked && <Check />}</i>
              </button>
            );
          })}
          {!visible.length && <p className={styles.noResult}>일치하는 카테고리가 없습니다.</p>}
        </div>
        <button
          type="button"
          className={styles.categoryFilterApply}
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          {draft.allCategories
            ? "전체 체크로 적용"
            : `${draft.categoryKeys.length}개 카테고리로 적용`}
        </button>
      </section>
    </div>,
    document.body
  );
}

function categoryTypeLabel(categoryType: string) {
  if (categoryType === "GAME") return "게임";
  if (categoryType === "SPORTS") return "스포츠";
  if (categoryType === "ENTERTAINMENT") return "엔터";
  return "기타";
}
