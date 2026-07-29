"use client";

import { ArrowLeft, CalendarDays, ExternalLink, Film, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { api } from "@/lib/api";
import type { PushPreference, Streamer } from "@/lib/types";
import { AlertToggleGrid } from "./alert-toggle-grid";
import { CompactCalendar } from "./compact-calendar";
import styles from "./mobile-app.module.css";

export function StreamersTab({
  streamers,
  selected,
  preference,
  onSelect,
  onChange
}: {
  streamers: Streamer[];
  selected: Streamer;
  preference: PushPreference;
  onSelect: (channelId: string) => void;
  onChange: (
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
}) {
  const [liveOnly, setLiveOnly] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const broadcasts = useQuery({
    queryKey: ["streamer-broadcasts", selected.channelId],
    queryFn: ({ signal }) => api.streamerBroadcasts(selected.channelId, signal),
    staleTime: 60_000,
    enabled: detailOpen
  });
  const liveStreamers = streamers.filter((streamer) => streamer.isLive);
  const selection = liveOnly ? liveStreamers : streamers;

  if (!detailOpen) {
    return (
      <section className={`${styles.tabScroll} ${styles.streamerTab}`}>
        <header className={styles.tabIntro}>
          <span>NOW & ARCHIVE</span>
          <h1>스트리머</h1>
          <p>상세 보기 버튼을 눌러 달력과 다시보기로 이동하세요.</p>
        </header>
        <div className={styles.streamerPickerHeading}>
          <strong>{liveOnly ? `방송 중 ${liveStreamers.length}명` : `전체 ${streamers.length}명`}</strong>
          <div>
            <button className={liveOnly ? styles.pickerFilterActive : ""} onClick={() => setLiveOnly(true)}>LIVE</button>
            <button className={!liveOnly ? styles.pickerFilterActive : ""} onClick={() => setLiveOnly(false)}>전체</button>
          </div>
        </div>
        <div className={styles.streamerIndex} aria-label="스트리머 목록">
          {selection.length > 0 ? selection.map((streamer) => (
            <article key={streamer.channelId}>
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
              <div>
                <strong>{streamer.channelName}</strong>
                <small>{streamer.isLive
                  ? <><Radio /> {streamer.currentCategory || "카테고리 확인 중"}</>
                  : `팔로워 순위 #${streamer.trackingRank ?? "-"}`}</small>
              </div>
              <button aria-label={`${streamer.channelName} 상세 보기`} onClick={() => {
                onSelect(streamer.channelId);
                setDetailOpen(true);
              }}><CalendarDays />상세 보기</button>
            </article>
          )) : <p className={styles.emptyLive}>현재 방송 중인 스트리머가 없습니다.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.tabScroll} ${styles.streamerTab}`}>
      <button className={styles.detailBack} onClick={() => setDetailOpen(false)}>
        <ArrowLeft /> 스트리머 목록
      </button>
      <article className={styles.streamerDetail}>
        <div className={styles.streamerDetailHeading}>
          <span className={styles.detailAvatar}>
            {selected.channelImageUrl
              ? <Image
                  src={selected.channelImageUrl}
                  alt=""
                  width={58}
                  height={58}
                  sizes="58px"
                  priority
                  style={{ width: "100%", height: "100%" }}
                />
              : selected.channelName.slice(0, 1)}
          </span>
          <div>
            <span className={selected.isLive ? styles.liveLabel : styles.offlineLabel}>
              {selected.isLive ? <><Radio /> LIVE</> : "OFFLINE"}
            </span>
            <h2>{selected.channelName}</h2>
            <p>{selected.currentCategory || "현재 방송 없음"}</p>
          </div>
          <a href={`https://chzzk.naver.com/${selected.channelId}`} target="_blank" rel="noreferrer" aria-label="치지직에서 보기"><ExternalLink /></a>
        </div>
        {selected.currentTitle && <p className={styles.currentTitle}>{selected.currentTitle}</p>}
        <AlertToggleGrid preference={preference} onChange={onChange} />
      </article>

      <CompactCalendar streamer={selected} />

      <section className={styles.vodSection}>
        <header><div><Film /><strong>최근 다시보기</strong></div><span>{broadcasts.data?.data.length ?? 0}개 기록</span></header>
        <div>
          {(broadcasts.data?.data ?? []).slice(0, 4).map((broadcast) => (
            <article key={broadcast.id}>
              <div>
                <strong>{broadcast.title}</strong>
                <small>{new Intl.DateTimeFormat("ko-KR", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }).format(broadcast.startedAt)} · {broadcast.category || "미분류"}</small>
              </div>
              {broadcast.vodUrl
                ? <a href={broadcast.vodUrl} target="_blank" rel="noreferrer">다시보기</a>
                : <span>연결 대기</span>}
            </article>
          ))}
          {!broadcasts.isLoading && !broadcasts.data?.data.length && <p>아직 수집된 방송 기록이 없습니다.</p>}
        </div>
      </section>
    </section>
  );
}
