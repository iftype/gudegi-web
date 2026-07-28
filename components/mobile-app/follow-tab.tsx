"use client";

import { Bell, CheckCircle2, ChevronRight, Radio, RefreshCw, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { AppUser } from "@/lib/auth-api";
import type { PushPreference, Streamer } from "@/lib/types";
import { AlertToggleGrid } from "./alert-toggle-grid";
import styles from "./mobile-app.module.css";

export function FollowTab({
  streamers,
  preferences,
  user,
  pushActive,
  pushBusy,
  onConnect,
  onChange,
  onOpenStreamer
}: {
  streamers: Streamer[];
  preferences: PushPreference[];
  user: AppUser | null;
  pushActive: boolean;
  pushBusy: boolean;
  onConnect: () => void;
  onChange: (
    channelId: string,
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
  onOpenStreamer: (channelId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const preferenceByChannel = useMemo(
    () => new Map(preferences.map((item) => [item.channelId, item])),
    [preferences]
  );
  const ordered = useMemo(() => [...streamers]
    .filter((streamer) => streamer.channelName.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      const aEnabled = preferenceByChannel.get(a.channelId)?.enabled ? 1 : 0;
      const bEnabled = preferenceByChannel.get(b.channelId)?.enabled ? 1 : 0;
      return bEnabled - aEnabled || Number(b.isLive) - Number(a.isLive)
        || (a.trackingRank ?? 999) - (b.trackingRank ?? 999);
    }), [preferenceByChannel, query, streamers]);
  const enabledCount = preferences.filter((item) => item.enabled).length;

  return (
    <section className={styles.tabScroll}>
      <header className={styles.tabIntro}>
        <span>MY FOLLOW</span>
        <h1>팔로우 설정</h1>
        <p>{user
          ? `계정에 저장한 ${enabledCount}명의 변경 알림을 관리합니다.`
          : `이 기기에 저장한 ${enabledCount}명의 변경 알림을 관리합니다.`}</p>
      </header>
      {user && (
        <div className={styles.apiNotice}>
          치지직 공식 API는 팔로우 목록 조회를 제공하지 않아, 구데기에서 직접 고른 목록을 계정에 저장합니다.
        </div>
      )}
      <button className={styles.followPushBanner} disabled={pushBusy} onClick={onConnect}>
        {pushBusy ? <RefreshCw className={styles.spinning} /> : pushActive ? <CheckCircle2 /> : <Bell />}
        <span>
          <strong>{pushActive ? "이 기기 알림 연결됨" : "이 기기에서 알림 받기"}</strong>
          <small>{pushActive ? "선택한 변경을 푸시로 알려드립니다." : "PWA 앱에서 한 번만 연결하면 됩니다."}</small>
        </span>
        {!pushActive && <ChevronRight />}
      </button>
      <label className={styles.inlineSearch}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="스트리머 검색"
        />
      </label>
      <div className={styles.followList}>
        {ordered.map((streamer) => {
          const preference = preferenceByChannel.get(streamer.channelId)!;
          return (
            <article className={preference.enabled ? styles.followActive : ""} key={streamer.channelId}>
              <button className={styles.followSummary} onClick={() => onOpenStreamer(streamer.channelId)}>
                <span className={styles.rowAvatar}>
                  {streamer.channelImageUrl
                    ? <Image src={streamer.channelImageUrl} alt="" width={46} height={46} loading="lazy" />
                    : streamer.channelName.slice(0, 1)}
                  {streamer.isLive && <i />}
                </span>
                <span className={styles.followCopy}>
                  <strong>{streamer.channelName}</strong>
                  <small>{streamer.isLive
                    ? <><Radio /> {streamer.currentCategory || "카테고리 확인 중"}</>
                    : "현재 오프라인"}</small>
                </span>
                <ChevronRight />
              </button>
              <AlertToggleGrid
                preference={preference}
                onChange={(key, checked) => onChange(streamer.channelId, key, checked)}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
