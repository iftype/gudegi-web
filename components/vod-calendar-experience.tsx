"use client";

import Link from "next/link";
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Settings2,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarBroadcast, PushPreference, Streamer } from "@/lib/types";

const KOREA_TIMEZONE = "Asia/Seoul";
const CATEGORY_COLORS = ["#00e676", "#0b4c2c", "#ffb000", "#ff6b35", "#6f8f7e", "#8d70d6"];
const STORAGE_ID = "chatline-push-subscription-id";
const STORAGE_PREFERENCES = "chatline-push-preferences";

function currentKoreaMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit"
  }).formatToParts();
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

function shiftMonth(value: string, amount: number) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function koreaDateKey(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(timestamp);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function monthCells(month: string) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const count = Math.ceil((firstWeekday + dayCount) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= dayCount ? day : null;
  });
}

function formatDuration(durationMs: number) {
  const hours = durationMs / 3_600_000;
  return hours >= 10 ? `${Math.round(hours)}시간` : `${hours.toFixed(1)}시간`;
}

export function VodCalendarExperience({ streamers }: { streamers: Streamer[] }) {
  const visibleStreamers = useMemo(() => streamers.slice(0, 5), [streamers]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [month, setMonth] = useState(currentKoreaMonth);
  const [selectedDay, setSelectedDay] = useState<CalendarBroadcast[] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storedPreferences, setStoredPreferences] = useState<PushPreference[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_PREFERENCES) ?? "[]") as PushPreference[];
    } catch {
      return [];
    }
  });
  const [subscriptionId, setSubscriptionId] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(STORAGE_ID) ?? ""
  );
  const [notificationState, setNotificationState] = useState("");
  const activeChannelId = selectedChannelId || visibleStreamers[0]?.channelId || "";
  const preferences = useMemo(() => {
    const byChannel = new Map(storedPreferences.map((item) => [item.channelId, item]));
    return visibleStreamers.map((streamer) => {
      const stored = byChannel.get(streamer.channelId);
      return stored ? {
        ...stored,
        enabled: stored.enabled ?? (stored.categoryChanged || stored.titleChanged)
      } : {
        channelId: streamer.channelId,
        enabled: false,
        categoryChanged: false,
        titleChanged: false
      };
    });
  }, [storedPreferences, visibleStreamers]);

  const monthly = useQuery({
    queryKey: ["monthly-streamer", activeChannelId, month],
    queryFn: ({ signal }) => api.monthlyStreamer(activeChannelId, month, signal),
    enabled: Boolean(activeChannelId),
    staleTime: 60_000
  });
  const pushConfig = useQuery({
    queryKey: ["push-config"],
    queryFn: ({ signal }) => api.pushConfig(signal),
    staleTime: 10 * 60_000
  });
  const broadcastsByDay = useMemo(() => {
    const grouped = new Map<number, CalendarBroadcast[]>();
    for (const broadcast of monthly.data?.data.broadcasts ?? []) {
      const day = Number(koreaDateKey(broadcast.startedAt).slice(8, 10));
      grouped.set(day, [...(grouped.get(day) ?? []), broadcast]);
    }
    return grouped;
  }, [monthly.data]);
  const statusByDay = useMemo(() => new Map(
    (monthly.data?.data.dayStatuses ?? []).map((item) => [Number(item.date.slice(8, 10)), item.status])
  ), [monthly.data]);
  const cells = useMemo(() => monthCells(month), [month]);
  const selectedStreamer = visibleStreamers.find((item) => item.channelId === activeChannelId);

  async function persistPreferences(next: PushPreference[]) {
    setStoredPreferences(next);
    window.localStorage.setItem(STORAGE_PREFERENCES, JSON.stringify(next));
    if (!subscriptionId) return;
    try {
      await api.savePushPreferences(subscriptionId, next);
      setNotificationState("알림 설정을 저장했습니다.");
    } catch {
      setNotificationState("알림 설정을 저장하지 못했습니다.");
    }
  }

  function changePreference(
    channelId: string,
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) {
    const next = preferences.map((item) => {
      if (item.channelId !== channelId) return item;
      if (key === "enabled") {
        return checked && !item.categoryChanged && !item.titleChanged
          ? { ...item, enabled: true, categoryChanged: true }
          : { ...item, enabled: checked };
      }
      const updated = { ...item, enabled: checked ? true : item.enabled, [key]: checked };
      return !updated.categoryChanged && !updated.titleChanged
        ? { ...updated, enabled: false }
        : updated;
    });
    void persistPreferences(next);
  }

  async function enableNotifications() {
    if (!pushConfig.data?.data.enabled || !pushConfig.data.data.publicKey) {
      setNotificationState("서버의 푸시 알림 키가 아직 설정되지 않았습니다.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotificationState("이 브라우저는 웹 푸시 알림을 지원하지 않습니다.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotificationState("브라우저 알림 권한이 필요합니다.");
      return;
    }
    try {
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(pushConfig.data.data.publicKey)
      });
      const result = await api.createPushSubscription(subscription.toJSON());
      await api.savePushPreferences(result.data.id, preferences);
      setSubscriptionId(result.data.id);
      window.localStorage.setItem(STORAGE_ID, result.data.id);
      setNotificationState("이 기기에서 변경 알림을 받습니다.");
    } catch {
      setNotificationState("알림 구독을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function disableNotifications() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      if (subscriptionId) await api.deletePushSubscription(subscriptionId);
    } finally {
      setSubscriptionId("");
      window.localStorage.removeItem(STORAGE_ID);
      setNotificationState("이 기기의 알림을 껐습니다.");
    }
  }

  return (
    <section id="calendar" className="content-section calendar-section">
      <div className="section-heading calendar-heading">
        <div>
          <span className="kicker">VOD CALENDAR</span>
          <h2>방송을 달력으로 돌아보세요.</h2>
          <p>스트리머별 VOD와 카테고리 방송 시간을 한눈에 확인합니다.</p>
        </div>
        <button className="notification-settings-button" onClick={() => setSettingsOpen((open) => !open)}>
          <Settings2 /> 알림 설정
        </button>
      </div>

      {settingsOpen && (
        <NotificationSettings
          streamers={visibleStreamers}
          preferences={preferences}
          active={Boolean(subscriptionId)}
          state={notificationState}
          onChange={changePreference}
          onEnable={() => void enableNotifications()}
          onDisable={() => void disableNotifications()}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <div className="streamer-tabs" role="tablist" aria-label="스트리머 선택">
        {visibleStreamers.map((streamer) => (
          <button
            role="tab"
            aria-selected={streamer.channelId === activeChannelId}
            className={streamer.channelId === activeChannelId ? "active" : ""}
            key={streamer.channelId}
            onClick={() => setSelectedChannelId(streamer.channelId)}
          >
            <span className="tab-avatar">
              {streamer.channelImageUrl
                ? <img src={streamer.channelImageUrl} alt="" />
                : streamer.channelName.slice(0, 1)}
            </span>
            {streamer.channelName}
          </button>
        ))}
      </div>

      <div className="calendar-shell">
        <div className="calendar-toolbar">
          <div>
            <strong>{month.replace("-", ".")}</strong>
            <span>{selectedStreamer?.channelName ?? "스트리머"} VOD</span>
          </div>
          <div className="month-actions">
            <button onClick={() => setMonth((value) => shiftMonth(value, -1))} aria-label="이전 달"><ChevronLeft /></button>
            <button className="today" onClick={() => setMonth(currentKoreaMonth())}>오늘</button>
            <button onClick={() => setMonth((value) => shiftMonth(value, 1))} aria-label="다음 달"><ChevronRight /></button>
          </div>
        </div>
        <div className="calendar-status-legend" aria-label="날짜 상태 안내">
          <span><i className="no-broadcast" />방송 안 함</span>
          <span><i className="uncollected" />미수집</span>
          <span><i className="monitoring" />오늘 확인 중</span>
        </div>

        {monthly.isError ? (
          <div className="calendar-state">달력 데이터를 불러오지 못했습니다.</div>
        ) : (
          <div className={`vod-calendar ${monthly.isLoading ? "loading" : ""}`}>
            {["일", "월", "화", "수", "목", "금", "토"].map((weekday) => (
              <div className="calendar-weekday" key={weekday}>{weekday}</div>
            ))}
            {cells.map((day, index) => {
              const dayBroadcasts = day ? broadcastsByDay.get(day) ?? [] : [];
              const dayStatus = day ? statusByDay.get(day) : undefined;
              return (
                <div className={`calendar-day ${day ? "" : "outside"} ${dayStatus ? `status-${dayStatus}` : ""}`} key={`${month}-${index}`}>
                  {day && <span className="day-number">{day}</span>}
                  {day && <DayBroadcasts
                    broadcasts={dayBroadcasts}
                    fallbackImage={selectedStreamer?.channelImageUrl}
                    onMore={() => setSelectedDay(dayBroadcasts)}
                  />}
                  {day && dayBroadcasts.length === 0 && dayStatus && (
                    <DayStatus status={dayStatus} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CategoryChart
        categories={monthly.data?.data.categoryDurations ?? []}
        totalDurationMs={monthly.data?.data.totalDurationMs ?? 0}
      />

      {selectedDay && (
        <DayBroadcastModal
          broadcasts={selectedDay}
          fallbackImage={selectedStreamer?.channelImageUrl}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </section>
  );
}

function DayStatus({ status }: {
  status: "broadcast" | "no_broadcast" | "uncollected" | "monitoring";
}) {
  const label = status === "broadcast"
    ? "VOD 연결 대기"
    : status === "no_broadcast"
      ? "방송 안 함"
      : status === "monitoring"
        ? "오늘 확인 중"
        : "미수집";
  return <div className={`day-status ${status}`}><i />{label}</div>;
}

function DayBroadcasts({ broadcasts, fallbackImage, onMore }: {
  broadcasts: CalendarBroadcast[];
  fallbackImage?: string | null;
  onMore: () => void;
}) {
  if (!broadcasts.length) return null;
  const visible = broadcasts.length <= 3 ? broadcasts : broadcasts.slice(0, 2);
  return (
    <div className="day-broadcasts">
      {visible.map((broadcast) => (
        <BroadcastTile broadcast={broadcast} fallbackImage={fallbackImage} key={broadcast.id} />
      ))}
      {broadcasts.length > 3 && (
        <button className="more-broadcasts" onClick={onMore} aria-label={`${broadcasts.length}개 방송 모두 보기`}>
          <strong>+{broadcasts.length - 2}</strong>
          <span>전체 보기</span>
        </button>
      )}
    </div>
  );
}

function BroadcastTile({ broadcast, fallbackImage }: {
  broadcast: CalendarBroadcast;
  fallbackImage?: string | null;
}) {
  const image = broadcast.thumbnailUrl ?? fallbackImage ?? broadcast.channelImageUrl;
  return (
    <Link href={`/broadcasts/${broadcast.id}`} className="broadcast-tile" title={broadcast.title}>
      {image ? <img src={image} alt="" /> : <span className="tile-fallback"><CalendarDays /></span>}
      <span className="tile-shade" />
      <strong>{broadcast.title}</strong>
    </Link>
  );
}

function CategoryChart({ categories, totalDurationMs }: {
  categories: Array<{ category: string; durationMs: number; percentage: number }>;
  totalDurationMs: number;
}) {
  return (
    <div className="category-summary">
      <div className="category-summary-heading">
        <div><span className="kicker">CATEGORY SHARE</span><h3>이번 달 카테고리</h3></div>
        <span><Clock3 /> 총 {formatDuration(totalDurationMs)}</span>
      </div>
      {categories.length ? (
        <>
          <div className="category-stacked-bar" aria-label="카테고리별 방송 시간 비율">
            {categories.map((item, index) => (
              <i
                key={item.category}
                title={`${item.category} ${item.percentage.toFixed(1)}%`}
                style={{
                  width: `${item.percentage}%`,
                  background: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                }}
              />
            ))}
          </div>
          <div className="category-legend">
            {categories.map((item, index) => (
              <div key={item.category}>
                <i style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                <span>{item.category}</span>
                <strong>{formatDuration(item.durationMs)}</strong>
                <small>{item.percentage.toFixed(0)}%</small>
              </div>
            ))}
          </div>
        </>
      ) : <p className="category-empty">이 달에 수집된 카테고리 기록이 없습니다.</p>}
    </div>
  );
}

function NotificationSettings({ streamers, preferences, active, state, onChange, onEnable, onDisable, onClose }: {
  streamers: Streamer[];
  preferences: PushPreference[];
  active: boolean;
  state: string;
  onChange: (
    channelId: string,
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
  onEnable: () => void;
  onDisable: () => void;
  onClose: () => void;
}) {
  return (
    <div className="notification-panel">
      <div className="notification-panel-heading">
        <div><Bell /><span><strong>변경 알림</strong><small>이 기기에만 설정이 저장됩니다.</small></span></div>
        <button onClick={onClose} aria-label="알림 설정 닫기"><X /></button>
      </div>
      <div className="notification-grid">
        <span className="notification-grid-label">스트리머</span>
        <span className="notification-grid-label">선택</span>
        <span className="notification-grid-label">카테고리</span>
        <span className="notification-grid-label">방제</span>
        {streamers.map((streamer) => {
          const preference = preferences.find((item) => item.channelId === streamer.channelId);
          return (
            <div className="notification-row" key={streamer.channelId}>
              <strong>{streamer.channelName}</strong>
              <label><input type="checkbox" checked={preference?.enabled ?? false} onChange={(event) => onChange(streamer.channelId, "enabled", event.target.checked)} /><span /></label>
              <label className={!preference?.enabled ? "disabled" : ""}><input type="checkbox" disabled={!preference?.enabled} checked={preference?.categoryChanged ?? false} onChange={(event) => onChange(streamer.channelId, "categoryChanged", event.target.checked)} /><span /></label>
              <label className={!preference?.enabled ? "disabled" : ""}><input type="checkbox" disabled={!preference?.enabled} checked={preference?.titleChanged ?? false} onChange={(event) => onChange(streamer.channelId, "titleChanged", event.target.checked)} /><span /></label>
            </div>
          );
        })}
      </div>
      <div className="notification-panel-footer">
        <div>
          <p>{state || (active ? "이 기기에서 알림을 받고 있습니다." : "알림은 최대 약 2분 뒤 도착할 수 있습니다.")}</p>
          <small>iPhone·iPad는 홈 화면에 설치한 앱에서만 웹 푸시를 받을 수 있습니다.</small>
        </div>
        <button className={`button ${active ? "ghost" : "primary"}`} onClick={active ? onDisable : onEnable}>
          {active ? <BellOff /> : <Bell />}{active ? "알림 끄기" : "알림 켜기"}
        </button>
      </div>
    </div>
  );
}

function DayBroadcastModal({ broadcasts, fallbackImage, onClose }: {
  broadcasts: CalendarBroadcast[];
  fallbackImage?: string | null;
  onClose: () => void;
}) {
  const day = broadcasts[0] ? koreaDateKey(broadcasts[0].startedAt).replaceAll("-", ".") : "";
  return (
    <div className="day-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="day-modal" role="dialog" aria-modal="true" aria-label={`${day} 방송 목록`}>
        <div className="day-modal-heading">
          <div><span>{day}</span><h3>이날의 방송 {broadcasts.length}개</h3></div>
          <button onClick={onClose} aria-label="닫기"><X /></button>
        </div>
        <div className="day-modal-list">
          {broadcasts.map((broadcast) => (
            <Link href={`/broadcasts/${broadcast.id}`} key={broadcast.id}>
              <div>{broadcast.thumbnailUrl ?? fallbackImage ?? broadcast.channelImageUrl
                ? <img src={broadcast.thumbnailUrl ?? fallbackImage ?? broadcast.channelImageUrl ?? ""} alt="" />
                : <CalendarDays />}</div>
              <span><strong>{broadcast.title}</strong><small>{broadcast.category || "미분류"}</small></span>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function base64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
