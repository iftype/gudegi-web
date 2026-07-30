"use client";

import { ArrowLeft, BellPlus, CalendarDays, Check, ExternalLink, Film, Radio, Search, Send } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { CalendarBroadcast, Streamer } from "@/lib/types";
import { CompactCalendar, type CalendarDaySelection } from "./compact-calendar";
import { UnsupportedList } from "./unsupported-list";
import styles from "./mobile-app-chzzk-v7.module.css";

export function StreamersTab({
  streamers,
  selected,
  personalChannelIds,
  onSelect,
  unsupportedRequests = [],
  onAddToAlerts,
  onRemoveFromAlerts,
  onSuggest = () => undefined,
  onSuggestUnsupported = async () => undefined,
  openDetail = false,
  onCloseDetail
}: {
  streamers: Streamer[];
  selected: Streamer;
  personalChannelIds: string[];
  onSelect: (channelId: string) => void;
  unsupportedRequests?: import("@/lib/types").UnsupportedStreamerRequest[];
  onAddToAlerts: (channelId: string) => void;
  onRemoveFromAlerts: (channelId: string) => void;
  onSuggest?: () => void;
  onSuggestUnsupported?: (streamerName: string) => Promise<void>;
  openDetail?: boolean;
  onCloseDetail?: () => void;
}) {
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(openDetail);
  const [selectedDay, setSelectedDay] = useState<CalendarDaySelection | null>(null);
  const effectiveDetailOpen = detailOpen || openDetail;
  const selectCalendarDay = useCallback((selection: CalendarDaySelection | null) => {
    setSelectedDay(selection);
  }, []);
  const liveStreamers = streamers.filter((streamer) => streamer.isLive);
  const selection = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return streamers.filter((streamer) => (
      (!liveOnly || streamer.isLive)
      && (!normalized || streamer.channelName.toLowerCase().includes(normalized))
    ));
  }, [liveOnly, query, streamers]);
  if (!effectiveDetailOpen) {
    return (
      <section className={`${styles.tabScroll} ${styles.streamerTab}`}>
        <header className={styles.tabIntro}>
          <span>NOW & ARCHIVE</span>
          <h1>스트리머</h1>
          <p>수집 중인 스트리머를 보고 내 알림 목록에 바로 추가하세요.</p>
        </header>
        <label className={`${styles.inlineSearch} ${styles.streamerSearch}`}>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="스트리머 검색 후 알림 추가"
          />
        </label>
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
                        width={46}
                        height={46}
                        sizes="46px"
                        loading="lazy"
                        style={{ width: "100%", height: "100%" }}
                      />
                    : streamer.channelName.slice(0, 1)}
                  <i />
                </a>
              ) : (
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
                </span>
              )}
              <div>
                <strong>{streamer.channelName}</strong>
                <small>{streamer.isLive
                  ? <><Radio /> {streamer.currentCategory || "카테고리 확인 중"}</>
                  : `팔로워 순위 #${streamer.trackingRank ?? "-"}`}</small>
              </div>
              <div className={styles.streamerRowActions}>
                <button
                  className={personalChannelIds.includes(streamer.channelId) ? styles.alertAdded : ""}
                  aria-label={`${streamer.channelName} ${personalChannelIds.includes(streamer.channelId) ? "알림 목록에서 제거" : "알림 목록에 추가"}`}
                  onClick={() => personalChannelIds.includes(streamer.channelId)
                    ? onRemoveFromAlerts(streamer.channelId)
                    : onAddToAlerts(streamer.channelId)}
                >
                  {personalChannelIds.includes(streamer.channelId) ? <Check /> : <BellPlus />}
                  {personalChannelIds.includes(streamer.channelId) ? "추가됨" : "알림 추가"}
                </button>
                <button aria-label={`${streamer.channelName} 상세 보기`} onClick={() => {
                  onSelect(streamer.channelId);
                  setSelectedDay(null);
                  setDetailOpen(true);
                }}><CalendarDays />상세</button>
              </div>
            </article>
          )) : streamers.length > 0
            ? <p className={styles.emptyLive}>{query.trim()
                ? "검색 결과가 없습니다."
                : "현재 방송 중인 스트리머가 없습니다."}</p>
            : null}
        </div>
        <div className={styles.personalListActions}>
          <button onClick={onSuggest}><Send />원하는 스트리머 제안하기</button>
        </div>
        <UnsupportedList
          requests={unsupportedRequests}
          onSuggest={onSuggest}
          onSuggestUnsupported={onSuggestUnsupported}
        />
      </section>
    );
  }

  return (
    <section className={`${styles.tabScroll} ${styles.streamerTab}`}>
      <button className={styles.detailBack} onClick={() => {
        setDetailOpen(false);
        onCloseDetail?.();
      }}>
        <ArrowLeft /> 스트리머 목록
      </button>
      <article className={styles.streamerDetail}>
        <div className={styles.streamerDetailHeading}>
          {selected.isLive ? (
            <a
              className={styles.detailAvatar}
              href={`/open/chzzk/${encodeURIComponent(selected.channelId)}`}
              aria-label={`${selected.channelName} 방송 보기`}
            >
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
            </a>
          ) : (
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
          )}
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
      </article>

      <CompactCalendar streamer={selected} onDaySelect={selectCalendarDay} />

      <section className={styles.vodSection}>
        <header>
          <div><Film /><strong>{selectedDay ? formatSelectedDate(selectedDay.date) : "날짜별 다시보기"}</strong></div>
          <span>{selectedDay?.broadcasts.length ?? 0}개 기록</span>
        </header>
        <div>
          {(selectedDay?.broadcasts ?? []).map((broadcast) => (
            <article className={styles.dayBroadcastRecord} key={broadcast.id}>
              <div>
                <strong>{broadcast.title}</strong>
                <small>{new Intl.DateTimeFormat("ko-KR", {
                  timeZone: "Asia/Seoul",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }).format(broadcast.startedAt)} · {broadcast.category || "미분류"}</small>
                <CategoryTimeline broadcast={broadcast} />
              </div>
              {broadcast.vodUrl
                ? <a href={broadcast.vodUrl} target="_blank" rel="noreferrer">다시보기</a>
                : <span>연결 대기</span>}
            </article>
          ))}
          {!selectedDay && <p>달력에서 방송한 날짜를 선택해 주세요.</p>}
        </div>
      </section>
    </section>
  );
}

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T12:00:00+09:00`));
}

function CategoryTimeline({ broadcast }: { broadcast: CalendarBroadcast }) {
  const timeline = broadcast.categoryTimeline?.length
    ? broadcast.categoryTimeline
    : [{
        category: broadcast.category || "미분류",
        detectedAt: broadcast.startedAt,
        categoryImageUrl: broadcast.categoryImageUrl ?? null
      }];
  return (
    <div className={styles.categoryTimeline} aria-label={`${broadcast.title} 카테고리 전환 기록`}>
      {timeline.map((item, index) => (
        <div key={`${item.detectedAt}-${item.category}-${index}`}>
          <span className={styles.timelinePoster}>
            {item.categoryImageUrl
              ? <Image
                  src={item.categoryImageUrl}
                  alt=""
                  width={30}
                  height={38}
                  sizes="30px"
                  style={{ width: "100%", height: "100%" }}
                />
              : item.category.slice(0, 1)}
          </span>
          <span>
            <strong>{item.category}</strong>
            <small>{new Intl.DateTimeFormat("ko-KR", {
              timeZone: "Asia/Seoul",
              hour: "2-digit",
              minute: "2-digit"
            }).format(item.detectedAt)} 전환</small>
          </span>
        </div>
      ))}
    </div>
  );
}
