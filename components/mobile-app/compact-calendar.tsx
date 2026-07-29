"use client";

import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarBroadcast, Streamer } from "@/lib/types";
import styles from "./mobile-app.module.css";

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

export function CompactCalendar({ streamer }: { streamer: Streamer }) {
  const [month, setMonth] = useState(currentMonth);
  const monthly = useQuery({
    queryKey: ["mobile-month", streamer.channelId, month],
    queryFn: ({ signal }) => api.monthlyStreamer(streamer.channelId, month, signal),
    staleTime: 60_000
  });
  const cells = useMemo(() => monthCells(month), [month]);
  const broadcastsByDay = useMemo(() => {
    const grouped = new Map<number, CalendarBroadcast[]>();
    for (const broadcast of monthly.data?.data.broadcasts ?? []) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: KOREA_TIMEZONE,
        day: "2-digit"
      }).formatToParts(broadcast.startedAt);
      const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);
      grouped.set(day, [...(grouped.get(day) ?? []), broadcast]);
    }
    return grouped;
  }, [monthly.data]);
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

  return (
    <section className={styles.calendarView}>
      <header>
        <div><span>{streamer.channelName}</span><strong>{month.replace("-", ".")}</strong></div>
        <div>
          <button onClick={() => setMonth((value) => shiftMonth(value, -1))} aria-label="이전 달"><ChevronLeft /></button>
          <button onClick={() => setMonth(currentMonth())}>오늘</button>
          <button onClick={() => setMonth((value) => shiftMonth(value, 1))} aria-label="다음 달"><ChevronRight /></button>
        </div>
      </header>
      {monthly.isLoading ? (
        <div className={styles.calendarLoading}><LoaderCircle />달력을 불러오는 중</div>
      ) : (
        <div className={styles.compactCalendar}>
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span className={styles.weekday} key={day}>{day}</span>)}
          {cells.map((day, index) => {
            const broadcasts = day ? broadcastsByDay.get(day) ?? [] : [];
            const hasBroadcast = Boolean(day && (broadcasts.length > 0 || statusByDay.get(day) === "broadcast"));
            const categoryImage = broadcasts.find((item) => item.categoryImageUrl)?.categoryImageUrl;
            return (
              <div className={!day ? styles.outsideDay : hasBroadcast ? styles.broadcastDay : ""} key={index}>
                {day && <>
                  <span>{day}</span>
                  {categoryImage && <Image
                    src={categoryImage}
                    alt={broadcasts[0]?.category ?? "카테고리"}
                    fill
                    sizes="64px"
                  />}
                  {hasBroadcast && !categoryImage && <i>{broadcasts.length > 1 ? broadcasts.length : ""}</i>}
                  {broadcasts.length > 1 && categoryImage && <b>{broadcasts.length}</b>}
                </>}
              </div>
            );
          })}
        </div>
      )}
      <footer>
        <span><i />방송 기록</span>
        <strong>방송일 {broadcastDayCount}일 · 다시보기 {monthly.data?.data.broadcasts.length ?? 0}개</strong>
      </footer>
    </section>
  );
}
