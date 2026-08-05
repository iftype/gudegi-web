"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import styles from "@/app/admin/admin.module.css";
import { adminApi, formatTime } from "./api";
import {
  feedbackCategories,
  feedbackStatuses,
  type FeedbackCategory,
  type FeedbackStatus,
  type Overview
} from "./types";

export function FeedbackInbox({
  overview,
  onReload,
  onNotice
}: {
  overview: Overview;
  onReload: () => Promise<void>;
  onNotice: (message: string, kind?: "success" | "error") => void;
}) {
  const [category, setCategory] = useState<FeedbackCategory>("streamer_request");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  const categoryEntries = useMemo(() => overview.feedback.filter((entry) => (
    category === "idea"
      ? entry.category === "idea" || entry.category === "other"
      : entry.category === category
  )), [category, overview.feedback]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return categoryEntries.filter((entry) => {
      const matchesStatus = status === "all" || entry.status === status;
      const matchesQuery = !normalized || [
        entry.message,
        entry.contact,
        entry.targetChannelName,
        entry.targetChannelId
      ].some((value) => value?.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [categoryEntries, query, status]);

  const countFor = (target: FeedbackCategory) => overview.feedback.filter((entry) => (
    target === "idea"
      ? entry.category === "idea" || entry.category === "other"
      : entry.category === target
  )).length;

  async function updateStatus(id: number, nextStatus: FeedbackStatus) {
    setBusy(`feedback-${id}`);
    try {
      await adminApi(`/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      await onReload();
      onNotice("제안 처리 상태를 저장했습니다.");
    } catch {
      onNotice("제안 상태를 변경하지 못했습니다.", "error");
    } finally {
      setBusy("");
    }
  }

  async function remove(id: number) {
    if (!window.confirm("이 제안을 영구 삭제할까요?")) return;
    setBusy(`feedback-${id}`);
    try {
      await adminApi(`/feedback/${id}`, { method: "DELETE" });
      await onReload();
      onNotice("제안을 삭제했습니다.");
    } catch {
      onNotice("제안을 삭제하지 못했습니다.", "error");
    } finally {
      setBusy("");
    }
  }

  async function addRequestedStreamer(channelId: string, channelName: string) {
    setBusy(`streamer-${channelId}`);
    try {
      await adminApi("/streamers", {
        method: "POST",
        body: JSON.stringify({ channelId })
      });
      await onReload();
      onNotice(`${channelName} 채널을 추적 목록에 추가했습니다.`);
    } catch {
      onNotice("요청 채널을 추가하지 못했습니다.", "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>APP SUGGESTIONS</span>
          <h2>제안함</h2>
          <p>iOS 앱에서 접수한 내용을 종류별로 확인하고 처리합니다.</p>
        </div>
        <span className={styles.countBadge}>미처리 {overview.feedback.filter((item) => item.status === "new" || item.status === "reviewing").length}</span>
      </div>

      <nav className={styles.feedbackTabs} aria-label="제안 종류">
        {feedbackCategories.map((item) => (
          <button
            className={category === item.key ? styles.feedbackTabActive : ""}
            key={item.key}
            onClick={() => {
              setCategory(item.key);
              setStatus("all");
              setQuery("");
            }}
          >
            <span>{item.label}</span>
            <strong>{countFor(item.key)}</strong>
          </button>
        ))}
      </nav>

      {category === "streamer_request" && overview.streamerRequestDemand.length > 0 && (
        <div className={styles.requestQueue}>
          <div className={styles.subheading}>
            <div><h3>채널이 확인된 요청</h3><p>추적 추가를 누르면 요청자의 알림 목록에도 자동 반영됩니다.</p></div>
            <span>{overview.streamerRequestDemand.length}개</span>
          </div>
          <div className={styles.requestGrid}>
            {overview.streamerRequestDemand.map((item) => {
              const tracked = overview.streamers.some((streamer) => streamer.channelId === item.channelId && streamer.enabled);
              return <article key={item.channelId}>
                <div className={styles.requestIdentity}>
                  <span className={styles.avatar}>{item.channelImageUrl
                    ? <Image src={item.channelImageUrl} alt="" width={38} height={38} sizes="38px" />
                    : item.channelName.slice(0, 1)}</span>
                  <div><strong>{item.channelName}</strong><small>{item.requesterCount}명 · {item.requestCount}회 요청</small></div>
                </div>
                {tracked
                  ? <span className={styles.doneBadge}><Check size={13} />추적 중</span>
                  : <button
                    disabled={busy === `streamer-${item.channelId}`}
                    onClick={() => void addRequestedStreamer(item.channelId, item.channelName)}
                  ><Plus size={14} />추적 추가</button>}
              </article>;
            })}
          </div>
        </div>
      )}

      <div className={styles.inboxToolbar}>
        <label className={styles.searchField}>
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="내용, 연락처, 스트리머 검색"
          />
        </label>
        <div className={styles.statusFilters}>
          <button className={status === "all" ? styles.statusFilterActive : ""} onClick={() => setStatus("all")}>전체</button>
          {feedbackStatuses.map((item) => (
            <button
              className={status === item.key ? styles.statusFilterActive : ""}
              key={item.key}
              onClick={() => setStatus(item.key)}
            >{item.label}</button>
          ))}
        </div>
        <span className={styles.resultCount}>{visible.length}건</span>
      </div>

      <div className={styles.feedbackList}>
        {visible.map((entry) => (
          <article className={styles.feedbackCard} key={entry.id}>
            <div className={styles.feedbackMeta}>
              <span className={`${styles.feedbackStatus} ${styles[`feedbackStatus_${entry.status}`] ?? ""}`}>
                {feedbackStatuses.find((item) => item.key === entry.status)?.label ?? entry.status}
              </span>
              <time>{formatTime(entry.createdAt)}</time>
              {entry.requestCount > 1 && <span>{entry.requestCount}회 요청</span>}
            </div>
            <p className={styles.feedbackMessage}>{entry.message}</p>
            {(entry.targetChannelName || entry.contact) && <div className={styles.feedbackDetails}>
              {entry.targetChannelName && <span><strong>{entry.targetChannelName}</strong>{entry.targetChannelId}</span>}
              {entry.contact && <a href={`mailto:${entry.contact}`}>{entry.contact}</a>}
            </div>}
            <div className={styles.feedbackActions}>
              <button className={styles.secondaryButton} onClick={async () => {
                await navigator.clipboard.writeText(entry.message);
                onNotice("제안 내용을 복사했습니다.");
              }}><Copy size={14} />복사</button>
              <select
                aria-label="처리 상태"
                disabled={busy === `feedback-${entry.id}`}
                value={feedbackStatuses.some((item) => item.key === entry.status) ? entry.status : "new"}
                onChange={(event) => void updateStatus(entry.id, event.target.value as FeedbackStatus)}
              >
                {feedbackStatuses.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <button
                className={styles.deleteButton}
                disabled={busy === `feedback-${entry.id}`}
                onClick={() => void remove(entry.id)}
              ><Trash2 size={14} />삭제</button>
            </div>
          </article>
        ))}
        {!visible.length && <div className={styles.emptyState}>조건에 맞는 제안이 없습니다.</div>}
      </div>
    </section>
  );
}
