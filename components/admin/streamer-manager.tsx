"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import styles from "@/app/admin/admin.module.css";
import { adminApi, formatTime } from "./api";
import type { Overview, Streamer } from "./types";

type StreamerFilter = "all" | "enabled" | "live" | "disabled" | "error";

const filters: Array<{ key: StreamerFilter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "enabled", label: "추적 중" },
  { key: "live", label: "LIVE" },
  { key: "disabled", label: "추적 꺼짐" },
  { key: "error", label: "오류" }
];

export function StreamerManager({
  overview,
  onReload,
  onNotice
}: {
  overview: Overview;
  onReload: () => Promise<void>;
  onNotice: (message: string, kind?: "success" | "error") => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StreamerFilter>("enabled");
  const [busy, setBusy] = useState("");
  const activeCount = overview.streamers.filter((item) => item.enabled).length;

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return overview.streamers.filter((streamer) => {
      const matchesQuery = !normalized
        || streamer.channelName.toLowerCase().includes(normalized)
        || streamer.channelId.includes(normalized);
      const matchesFilter = filter === "all"
        || (filter === "enabled" && streamer.enabled)
        || (filter === "live" && streamer.isLive)
        || (filter === "disabled" && !streamer.enabled)
        || (filter === "error" && Boolean(streamer.lastError));
      return matchesQuery && matchesFilter;
    });
  }, [filter, overview.streamers, query]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const channelId = String(new FormData(form).get("channelId") ?? "").trim();
    setBusy("add");
    try {
      await adminApi("/streamers", {
        method: "POST",
        body: JSON.stringify({ channelId })
      });
      form.reset();
      await onReload();
      onNotice("스트리머를 추적 목록에 추가했습니다.");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      onNotice(code === "capacity_reached"
        ? "활성 추적 채널 한도에 도달했습니다."
        : "채널을 찾지 못했습니다. 치지직 URL이나 채널 ID를 확인해 주세요.", "error");
    } finally {
      setBusy("");
    }
  }

  async function toggle(streamer: Streamer) {
    setBusy(streamer.channelId);
    try {
      await adminApi(`/streamers/${streamer.channelId}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !streamer.enabled })
      });
      await onReload();
      onNotice(streamer.enabled ? "추적을 껐습니다." : "추적을 시작했습니다.");
    } catch {
      onNotice("추적 상태를 변경하지 못했습니다.", "error");
    } finally {
      setBusy("");
    }
  }

  async function remove(streamer: Streamer) {
    if (!window.confirm(`${streamer.channelName} 채널과 수집 기록을 모두 삭제할까요?`)) return;
    setBusy(streamer.channelId);
    try {
      await adminApi(`/streamers/${streamer.channelId}`, { method: "DELETE" });
      await onReload();
      onNotice("스트리머와 관련 기록을 삭제했습니다.");
    } catch {
      onNotice("스트리머를 삭제하지 못했습니다.", "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>STREAMER OPERATIONS</span>
          <h2>스트리머 관리</h2>
          <p>추적 대상을 추가하고 수집 상태를 관리합니다.</p>
        </div>
        <span className={styles.countBadge}>활성 {activeCount} / {overview.limits.maxActiveStreamers}</span>
      </div>

      <form className={styles.addStreamerForm} onSubmit={add}>
        <div>
          <label htmlFor="channel-reference">스트리머 추가</label>
          <p>치지직 채널 주소 또는 32자리 채널 ID를 붙여넣으세요.</p>
        </div>
        <input id="channel-reference" name="channelId" placeholder="https://chzzk.naver.com/채널ID" required />
        <button disabled={busy === "add"}><Plus size={15} />{busy === "add" ? "확인 중" : "추가"}</button>
      </form>

      <div className={styles.streamerToolbar}>
        <label className={styles.searchField}>
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 채널 ID 검색"
          />
        </label>
        <div className={styles.statusFilters}>
          {filters.map((item) => (
            <button
              className={filter === item.key ? styles.statusFilterActive : ""}
              key={item.key}
              onClick={() => setFilter(item.key)}
            >{item.label}</button>
          ))}
        </div>
        <span className={styles.resultCount}>{visible.length}명</span>
      </div>

      <div className={styles.streamerList}>
        {visible.map((streamer) => (
          <article key={streamer.channelId}>
            <div className={styles.streamerIdentity}>
              <span className={styles.avatar}>
                {streamer.channelImageUrl
                  ? <Image src={streamer.channelImageUrl} alt="" width={38} height={38} sizes="38px" />
                  : streamer.channelName.slice(0, 1)}
                {streamer.isLive && <i />}
              </span>
              <div>
                <a href={`https://chzzk.naver.com/${streamer.channelId}`} target="_blank" rel="noreferrer">
                  {streamer.channelName}<ExternalLink size={12} />
                </a>
                <small>{streamer.channelId}</small>
              </div>
            </div>
            <div className={styles.streamerNow}>
              <span className={streamer.isLive ? styles.liveBadge : styles.offlineBadge}>
                {streamer.isLive ? "LIVE" : streamer.enabled ? "OFFLINE" : "OFF"}
              </span>
              <div>
                <strong>{streamer.currentCategory || "방송 없음"}</strong>
                <small title={streamer.currentTitle ?? undefined}>{streamer.currentTitle || "현재 방송 제목 없음"}</small>
              </div>
            </div>
            <div className={styles.streamerCheck}>
              <span>최근 확인</span>
              <strong>{formatTime(streamer.lastCheckedAt)}</strong>
              {streamer.lastError && <small>{streamer.lastError}</small>}
            </div>
            <div className={styles.streamerActions}>
              <button
                className={streamer.enabled ? styles.trackingButton : styles.secondaryButton}
                disabled={busy === streamer.channelId}
                onClick={() => void toggle(streamer)}
              >{streamer.enabled ? "추적 중" : "추적 켜기"}</button>
              <button
                className={styles.deleteButton}
                disabled={busy === streamer.channelId}
                onClick={() => void remove(streamer)}
              ><Trash2 size={14} />삭제</button>
            </div>
          </article>
        ))}
        {!visible.length && <div className={styles.emptyState}>조건에 맞는 스트리머가 없습니다.</div>}
      </div>
    </section>
  );
}
