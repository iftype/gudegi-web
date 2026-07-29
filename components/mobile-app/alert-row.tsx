"use client";

import { Radio } from "lucide-react";
import Image from "next/image";
import type { PushPreference, Streamer } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function AlertRow({
  streamer,
  preference,
  onChange
}: {
  streamer: Streamer;
  preference: PushPreference;
  onChange: (
    channelId: string,
    key: "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
}) {
  const active = preference.categoryChanged || preference.titleChanged;

  return (
    <article className={`${styles.alertRow} ${active ? styles.followActive : ""}`}>
      <div className={styles.alertRowContent}>
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
