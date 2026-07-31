"use client";

import { BellRing, Check, ListChecks, Plus, Tags, Type, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import type { AlertRules } from "@/lib/types";
import styles from "./mobile-app-chzzk-v7.module.css";

export function AlertRuleSheet({
  streamerName,
  value,
  onApply,
  onClose
}: {
  streamerName: string;
  value: AlertRules;
  onApply: (value: AlertRules) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AlertRules>({
    ...value,
    keywords: [...value.keywords]
  });
  const [keywordDraft, setKeywordDraft] = useState("");

  function addKeyword(event: FormEvent) {
    event.preventDefault();
    const keyword = keywordDraft.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (keyword.length < 2 || draft.keywords.length >= 10) return;
    if (!draft.keywords.some((item) =>
      item.toLocaleLowerCase("ko-KR") === keyword.toLocaleLowerCase("ko-KR"))) {
      setDraft((current) => ({ ...current, keywords: [...current.keywords, keyword] }));
    }
    setKeywordDraft("");
  }

  const choices = [
    {
      key: "liveStarted" as const,
      label: "방송 시작",
      description: "방송이 시작되면 알려드려요.",
      icon: <BellRing />
    },
    {
      key: "titleChanged" as const,
      label: "방제 변경",
      description: "방송 제목이 바뀌면 알려드려요.",
      icon: <Type />
    },
    {
      key: "categoryChanged" as const,
      label: "카테고리 변경",
      description: "방송 카테고리가 바뀌면 알려드려요.",
      icon: <Tags />
    }
  ];

  return createPortal(
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={`${styles.sheet} ${styles.alertRuleSheet}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${streamerName} 알림 조건`}
      >
        <div className={styles.sheetHandle} />
        <header className={styles.sheetHeader}>
          <div>
            <span>ALERT CONDITION</span>
            <h2>알림 조건</h2>
          </div>
          <button onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        <div className={styles.alertRuleContent}>
          <div className={styles.alertRuleChoices}>
            {choices.map((choice) => {
              const selected = draft[choice.key];
              return (
                <button
                  type="button"
                  key={choice.key}
                  className={selected ? styles.alertRuleChoiceSelected : ""}
                  aria-pressed={selected}
                  aria-label={`${streamerName} ${choice.label} 알림`}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    [choice.key]: !current[choice.key]
                  }))}
                >
                  <i>{choice.icon}</i>
                  <span><strong>{choice.label}</strong><small>{choice.description}</small></span>
                  <b>{selected && <Check />}</b>
                </button>
              );
            })}
          </div>
          <section className={styles.alertKeywordSection}>
            <header>
              <span><ListChecks /></span>
              <div><strong>방제 키워드</strong><small>새 방제에 단어가 포함되면 알려드려요.</small></div>
              <em>{draft.keywords.length}/10</em>
            </header>
            <form onSubmit={addKeyword}>
              <input
                value={keywordDraft}
                maxLength={40}
                aria-label={`${streamerName} 키워드`}
                placeholder="키워드 입력 (예: 합방)"
                onChange={(event) => setKeywordDraft(event.target.value)}
              />
              <button
                type="submit"
                aria-label={`${streamerName} 키워드 추가`}
                disabled={keywordDraft.trim().length < 2 || draft.keywords.length >= 10}
              ><Plus /></button>
            </form>
            <div className={styles.alertKeywordList}>
              {draft.keywords.map((keyword) => (
                <button
                  type="button"
                  key={keyword.toLocaleLowerCase("ko-KR")}
                  aria-label={`${keyword} 키워드 삭제`}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    keywords: current.keywords.filter((item) => item !== keyword)
                  }))}
                >#{keyword}<X /></button>
              ))}
              {!draft.keywords.length && <small>아직 등록한 키워드가 없습니다.</small>}
            </div>
          </section>
        </div>
        <button
          type="button"
          className={styles.categoryFilterApply}
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >알림 조건 적용</button>
      </section>
    </div>,
    document.body
  );
}
