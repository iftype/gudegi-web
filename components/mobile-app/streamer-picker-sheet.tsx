"use client";

import { Check, Radio, Search, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Streamer } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function StreamerPickerSheet({
  streamers,
  selectedChannelId,
  onSelect,
  onClose
}: {
  streamers: Streamer[];
  selectedChannelId: string;
  onSelect: (channelId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const filtered = useMemo(() => streamers.filter((streamer) => {
    const matchesQuery = streamer.channelName.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (!liveOnly || streamer.isLive);
  }), [liveOnly, query, streamers]);

  return (
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-label="스트리머 선택">
        <div className={styles.sheetHandle} />
        <header className={styles.sheetHeader}>
          <div><span>TOP 50</span><h2>스트리머 선택</h2></div>
          <button onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        <div className={styles.pickerTools}>
          <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="스트리머 검색" autoFocus /></label>
          <button className={liveOnly ? styles.filterActive : ""} onClick={() => setLiveOnly((value) => !value)}>
            <Radio /> LIVE
          </button>
        </div>
        <div className={styles.streamerChoices}>
          {filtered.map((streamer) => {
            const selected = streamer.channelId === selectedChannelId;
            return (
              <button
                key={streamer.channelId}
                className={selected ? styles.streamerSelected : ""}
                onClick={() => {
                  onSelect(streamer.channelId);
                  onClose();
                }}
              >
                <span className={styles.choiceAvatar}>
                  {streamer.channelImageUrl
                    ? <Image src={streamer.channelImageUrl} alt="" width={36} height={36} loading="lazy" />
                    : streamer.channelName.slice(0, 1)}
                  {streamer.isLive && <i />}
                </span>
                <span className={styles.choiceName}>
                  <strong>{streamer.channelName}</strong>
                  <small>#{streamer.trackingRank ?? "-"} · {(streamer.followerCount ?? 0).toLocaleString()}명</small>
                  <em className={streamer.isLive ? styles.choiceCategoryLive : ""}>
                    {streamer.isLive ? streamer.currentCategory || "카테고리 확인 중" : "오프라인"}
                  </em>
                </span>
                <span className={styles.choiceCheck}>{selected && <Check />}</span>
              </button>
            );
          })}
          {!filtered.length && <p className={styles.noResult}>조건에 맞는 스트리머가 없습니다.</p>}
        </div>
      </section>
    </div>
  );
}
