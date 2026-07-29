"use client";

import { Radio, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { PushPreference, Streamer } from "@/lib/types";
import styles from "./mobile-app.module.css";

const DELETE_ACTION_WIDTH = 78;
const DELETE_SWIPE_THRESHOLD = 132;

export function SwipeableAlertRow({
  streamer,
  preference,
  onChange,
  onDelete
}: {
  streamer: Streamer;
  preference: PushPreference;
  onChange: (
    channelId: string,
    key: "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
  onDelete: (channelId: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const pointerStart = useRef<{
    x: number;
    offset: number;
    captured: boolean;
  } | null>(null);
  const currentOffset = useRef(0);
  const active = preference.categoryChanged || preference.titleChanged;

  function moveTo(nextOffset: number) {
    currentOffset.current = nextOffset;
    setOffset(nextOffset);
  }

  function clearAlerts() {
    moveTo(0);
    onDelete(streamer.channelId);
  }

  return (
    <article
      className={`${styles.swipeRow} ${active ? styles.followActive : ""}`}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, offset, captured: false };
      }}
      onPointerMove={(event) => {
        if (!pointerStart.current) return;
        const distance = event.clientX - pointerStart.current.x;
        if (!pointerStart.current.captured && Math.abs(distance) > 8) {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          pointerStart.current.captured = true;
        }
        moveTo(Math.max(
          -DELETE_SWIPE_THRESHOLD - 12,
          Math.min(0, pointerStart.current.offset + distance)
        ));
      }}
      onPointerUp={() => {
        pointerStart.current = null;
        if (currentOffset.current <= -DELETE_SWIPE_THRESHOLD) {
          clearAlerts();
          return;
        }
        moveTo(currentOffset.current < -30 ? -DELETE_ACTION_WIDTH : 0);
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
        moveTo(0);
      }}
    >
      <button
        type="button"
        className={styles.swipeDelete}
        onClick={clearAlerts}
        aria-label={`${streamer.channelName} 알림 설정 삭제`}
      >
        <Trash2 />
        <span>삭제</span>
      </button>
      <div
        className={styles.swipeContent}
        style={{ transform: `translateX(${offset}px)` }}
      >
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
        <span className={styles.followCopy}>
          <strong>{streamer.channelName}</strong>
          <small>{streamer.isLive
            ? <><Radio /> {streamer.currentCategory || "카테고리 확인 중"}</>
            : `팔로워 순위 #${streamer.trackingRank ?? "-"}`}</small>
        </span>
        <span className={styles.rowAlertToggles}>
          <button
            type="button"
            className={preference.categoryChanged ? styles.rowAlertToggleActive : ""}
            aria-pressed={preference.categoryChanged}
            aria-label={`${streamer.channelName} 카테고리 변경 알림`}
            onClick={() => onChange(
              streamer.channelId,
              "categoryChanged",
              !preference.categoryChanged
            )}
          >
            카테고리
          </button>
          <button
            type="button"
            className={preference.titleChanged ? styles.rowAlertToggleActive : ""}
            aria-pressed={preference.titleChanged}
            aria-label={`${streamer.channelName} 제목 변경 알림`}
            onClick={() => onChange(
              streamer.channelId,
              "titleChanged",
              !preference.titleChanged
            )}
          >
            제목 변경
          </button>
        </span>
      </div>
    </article>
  );
}
