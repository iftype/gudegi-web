"use client";

import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarBroadcast, Streamer } from "@/lib/types";
import styles from "./mobile-app-chzzk-v7.module.css";

const KOREA_TIMEZONE = "Asia/Seoul";

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit"
  }).formatToParts();
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}`;
}

function shiftMonth(value: string, amount: number) {
  const date = new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthCells(month: string) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const first = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - first + 1;
    return day > 0 && day <= days ? day : null;
  });
}

export type CalendarDaySelection = {
  date: string;
  broadcasts: CalendarBroadcast[];
};

export function CompactCalendar({
  streamer,
  onDaySelect
}: {
  streamer: Streamer;
  onDaySelect?: (selection: CalendarDaySelection | null) => void;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const monthly = useQuery({
    queryKey: ["mobile-month", streamer.channelId, month],
    queryFn: ({ signal }) => api.monthlyStreamer(streamer.channelId, month, signal),
    staleTime: 60_000
  });
  const cells = useMemo(() => monthCells(month), [month]);
  const categoryOptions = useMemo(() => Array.from(new Set(
    (monthly.data?.data.broadcasts ?? []).flatMap(broadcastCategories)
  )).sort((left, right) => left.localeCompare(right, "ko-KR")), [monthly.data]);
  const effectiveCategory = selectedCategory === "all"
    || categoryOptions.includes(selectedCategory)
    ? selectedCategory
    : "all";
  const filteredBroadcasts = useMemo(() => (
    (monthly.data?.data.broadcasts ?? []).filter((broadcast) => (
      effectiveCategory === "all"
      || broadcastCategories(broadcast).includes(effectiveCategory)
    ))
  ), [effectiveCategory, monthly.data]);
  const broadcastsByDay = useMemo(() => {
    const grouped = new Map<number, CalendarBroadcast[]>();
    for (const broadcast of filteredBroadcasts) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: KOREA_TIMEZONE,
        day: "2-digit"
      }).formatToParts(broadcast.startedAt);
      const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);
      grouped.set(day, [...(grouped.get(day) ?? []), broadcast]);
    }
    return grouped;
  }, [filteredBroadcasts]);
  const statusByDay = useMemo(() => new Map(
    (monthly.data?.data.dayStatuses ?? []).map((item) => [
      Number(item.date.slice(8, 10)),
      item.status
    ])
  ), [monthly.data]);
  const broadcastDayCount = useMemo(
    () => [...statusByDay.values()].filter((status) => status === "broadcast").length,
    [statusByDay]
  );
  function selectDay(day: number, broadcasts: CalendarBroadcast[]) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    onDaySelect?.({ date, broadcasts });
  }

  function changeMonth(amount: number) {
    setMonth((value) => shiftMonth(value, amount));
    setSelectedDate(null);
    onDaySelect?.(null);
  }

  return (
    <section className={styles.calendarView}>
      <header>
        <div><span>{streamer.channelName}</span><strong>{month.replace("-", ".")}</strong></div>
        <div>
          <button onClick={() => changeMonth(-1)} aria-label="이전 달"><ChevronLeft /></button>
          <button onClick={() => {
            setMonth(currentMonth());
            setSelectedDate(null);
            onDaySelect?.(null);
          }}>오늘</button>
          <button onClick={() => changeMonth(1)} aria-label="다음 달"><ChevronRight /></button>
        </div>
      </header>
      <label className={styles.calendarCategoryFilter}>
        <span>다시보기 필터</span>
        <select
          value={effectiveCategory}
          onChange={(event) => {
            setSelectedCategory(event.target.value);
            setSelectedDate(null);
            onDaySelect?.(null);
          }}
        >
          <option value="all">전체 카테고리</option>
          {categoryOptions.map((category) => (
            <option value={category} key={category}>{category}</option>
          ))}
        </select>
      </label>
      {monthly.isLoading ? (
        <div className={styles.calendarLoading}><LoaderCircle />달력을 불러오는 중</div>
      ) : (
        <div className={styles.compactCalendar}>
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span className={styles.weekday} key={day}>{day}</span>)}
          {cells.map((day, index) => {
            const broadcasts = day ? broadcastsByDay.get(day) ?? [] : [];
            const hasBroadcast = Boolean(day && (
              broadcasts.length > 0
              || (effectiveCategory === "all" && statusByDay.get(day) === "broadcast")
            ));
            const categoryImage = broadcasts.find((item) => item.categoryImageUrl)?.categoryImageUrl;
            const category = broadcasts.find((item) => item.category)?.category;
            return (
              <button
                type="button"
                disabled={!day || !hasBroadcast}
                aria-label={day && hasBroadcast ? `${month}-${String(day).padStart(2, "0")} 방송 기록 보기` : undefined}
                aria-pressed={Boolean(day && selectedDate === `${month}-${String(day).padStart(2, "0")}`)}
                className={[
                  styles.calendarDayButton,
                  !day ? styles.outsideDay : "",
                  hasBroadcast ? styles.broadcastDay : "",
                  day && selectedDate === `${month}-${String(day).padStart(2, "0")}`
                    ? styles.selectedBroadcastDay
                    : ""
                ].filter(Boolean).join(" ")}
                key={index}
                onClick={() => day && hasBroadcast && selectDay(day, broadcasts)}
              >
                {day && <>
                  <span>{day}</span>
                  {categoryImage && <Image
                    src={categoryImage}
                    alt={category ?? "카테고리"}
                    fill
                    sizes="64px"
                  />}
                  {category && <small className={styles.calendarCategory}>{category}</small>}
                  {hasBroadcast && !categoryImage && <i>{broadcasts.length > 1 ? broadcasts.length : ""}</i>}
                  {broadcasts.length > 1 && categoryImage && <b>{broadcasts.length}</b>}
                </>}
              </button>
            );
          })}
        </div>
      )}
      <footer>
        <span><i />방송 기록</span>
        <strong>방송일 {broadcastDayCount}일 · 다시보기 {
          filteredBroadcasts.filter((broadcast) => broadcast.vodUrl).length
        }개</strong>
      </footer>
    </section>
  );
}

function broadcastCategories(broadcast: CalendarBroadcast) {
  const timeline = broadcast.categoryTimeline?.map((item) => item.category) ?? [];
  return timeline.length ? timeline : [broadcast.category || "미분류"];
}
