"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import type { CalendarBroadcast, Streamer } from "@/lib/types";

const KOREA_TIMEZONE = "Asia/Seoul";
const CATEGORY_COLORS = ["#00e676", "#0b4c2c", "#ffb000", "#ff6b35", "#6f8f7e", "#8d70d6"];

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
  const visibleStreamers = streamers;
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [month, setMonth] = useState(currentKoreaMonth);
  const [selectedDay, setSelectedDay] = useState<CalendarBroadcast[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const activeChannelId = selectedChannelId || visibleStreamers[0]?.channelId || "";

  const monthly = useQuery({
    queryKey: ["monthly-streamer", activeChannelId, month],
    queryFn: ({ signal }) => api.monthlyStreamer(activeChannelId, month, signal),
    enabled: Boolean(activeChannelId),
    staleTime: 60_000
  });
  const categoryOptions = useMemo(() => Array.from(new Set(
    (monthly.data?.data.broadcasts ?? []).map((broadcast) => broadcast.category || "미분류")
  )).sort((left, right) => left.localeCompare(right, "ko-KR")), [monthly.data]);
  const effectiveCategory = selectedCategory === "all"
    || categoryOptions.includes(selectedCategory)
    ? selectedCategory
    : "all";
  const filteredBroadcasts = useMemo(() => (
    (monthly.data?.data.broadcasts ?? []).filter((broadcast) => (
      effectiveCategory === "all"
      || (broadcast.category || "미분류") === effectiveCategory
    ))
  ), [effectiveCategory, monthly.data]);
  const broadcastsByDay = useMemo(() => {
    const grouped = new Map<number, CalendarBroadcast[]>();
    for (const broadcast of filteredBroadcasts) {
      const day = Number(koreaDateKey(broadcast.startedAt).slice(8, 10));
      grouped.set(day, [...(grouped.get(day) ?? []), broadcast]);
    }
    return grouped;
  }, [filteredBroadcasts]);
  const statusByDay = useMemo(() => new Map(
    (monthly.data?.data.dayStatuses ?? []).map((item) => [Number(item.date.slice(8, 10)), item.status])
  ), [monthly.data]);
  const cells = useMemo(() => monthCells(month), [month]);
  const selectedStreamer = visibleStreamers.find((item) => item.channelId === activeChannelId);
  const filteredCategorySummary = useMemo(() => {
    const categories = monthly.data?.data.categoryDurations ?? [];
    if (effectiveCategory === "all") {
      return {
        categories,
        totalDurationMs: monthly.data?.data.totalDurationMs ?? 0
      };
    }
    const selected = categories.find((item) => item.category === effectiveCategory);
    return {
      categories: selected ? [{ ...selected, percentage: 100 }] : [],
      totalDurationMs: selected?.durationMs ?? 0
    };
  }, [effectiveCategory, monthly.data]);

  return (
    <section id="calendar" className="content-section calendar-section">
      <div id="alerts" className="anchor-target" />
      <div className="section-heading calendar-heading">
        <div>
          <span className="kicker">VOD CALENDAR</span>
          <h2>방송을 달력으로 돌아보세요.</h2>
          <p>스트리머와 카테고리를 골라 다시보기 기록만 탐색합니다.</p>
        </div>
      </div>

      <div className="streamer-picker">
        <label htmlFor="calendar-streamer">스트리머</label>
        <select
          id="calendar-streamer"
          value={activeChannelId}
          onChange={(event) => {
            setSelectedChannelId(event.target.value);
            setSelectedCategory("all");
            trackEvent("calendar_streamer_selected", { channelId: event.target.value });
          }}
        >
          {visibleStreamers.map((streamer) => (
            <option value={streamer.channelId} key={streamer.channelId}>{streamer.channelName}</option>
          ))}
        </select>
        <label htmlFor="calendar-category">카테고리</label>
        <select
          id="calendar-category"
          value={effectiveCategory}
          onChange={(event) => {
            setSelectedCategory(event.target.value);
            setSelectedDay(null);
          }}
        >
          <option value="all">전체 카테고리</option>
          {categoryOptions.map((category) => (
            <option value={category} key={category}>{category}</option>
          ))}
        </select>
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
                  {day && dayBroadcasts.length === 0 && dayStatus
                    && (effectiveCategory === "all" || dayStatus !== "broadcast") && (
                    <DayStatus status={dayStatus} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CategoryChart
        categories={filteredCategorySummary.categories}
        totalDurationMs={filteredCategorySummary.totalDurationMs}
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
    ? "방송 기록"
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
    <Link
      href={`/broadcasts/${broadcast.id}`}
      className="broadcast-tile"
      title={broadcast.title}
      onClick={() => trackEvent("vod_opened")}
    >
      {image ? <img src={image} alt="" /> : <span className="tile-fallback"><CalendarDays /></span>}
      <span className="tile-shade" />
      <small>{broadcast.category || "미분류"}</small>
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
