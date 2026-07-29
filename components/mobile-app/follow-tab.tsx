"use client";

import { Bell, CheckCircle2, Plus, RefreshCw, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppUser } from "@/lib/auth-api";
import type { PushPreference, Streamer } from "@/lib/types";
import styles from "./mobile-app.module.css";
import { AlertRow } from "./alert-row";
import { UnsupportedList } from "./unsupported-list";

export function FollowTab({
  streamers,
  preferences,
  user,
  pushActive,
  pushBusy,
  pushMessage,
  onConnect,
  onChange,
  onChangeAll,
  onAdd = () => undefined,
  onRemove,
  unsupportedRequests = [],
  onSuggest = () => undefined
}: {
  streamers: Streamer[];
  preferences: PushPreference[];
  user: AppUser | null;
  pushActive: boolean;
  pushBusy: boolean;
  pushMessage: string;
  onConnect: () => void;
  onChange: (
    channelId: string,
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
  onChangeAll: (checked: boolean) => void;
  onAdd?: () => void;
  onRemove?: (channelId: string) => void;
  unsupportedRequests?: import("@/lib/types").UnsupportedStreamerRequest[];
  onSuggest?: () => void;
}) {
  const [query, setQuery] = useState("");
  const preferenceByChannel = useMemo(
    () => new Map(preferences.map((item) => [item.channelId, item])),
    [preferences]
  );
  const visible = useMemo(() => streamers.filter(
    (streamer) => streamer.channelName.toLowerCase().includes(query.trim().toLowerCase())
  ), [query, streamers]);
  const enabledCount = preferences.filter((item) => item.enabled).length;
  const allSelected = preferences.length > 0 && enabledCount === preferences.length;

  return (
    <section className={styles.tabScroll}>
      <header className={styles.tabIntro}>
        <span>MY ALERTS</span>
        <h1>알림 관리</h1>
        <p>{user
          ? `계정에 저장한 ${enabledCount}명의 카테고리·제목 알림을 관리합니다.`
          : `이 기기에 저장한 ${enabledCount}명의 카테고리·제목 알림을 관리합니다.`}</p>
      </header>
      <button className={styles.followPushBanner} disabled={pushBusy} onClick={onConnect}>
        {pushBusy ? <RefreshCw className={styles.spinning} /> : pushActive ? <CheckCircle2 /> : <Bell />}
        <span>
          <strong>{pushActive ? "이 기기 알림 연결됨" : "이 기기에서 알림 받기"}</strong>
          <small>{pushActive
            ? enabledCount > 0
              ? `선택한 ${enabledCount}명의 카테고리·방제 변경을 알려드려요.`
              : "아래에서 알림 받을 스트리머를 선택하세요."
            : "PWA 앱에서 한 번만 연결하면 됩니다."}</small>
        </span>
      </button>
      {pushMessage && <p className={styles.followPushMessage}>{pushMessage}</p>}
      <div className={styles.followTools}>
        <label className={styles.inlineSearch}>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="스트리머 검색"
          />
        </label>
        <label className={styles.selectAll}>
          <span><strong>전체 선택</strong><small>{enabledCount}/{preferences.length}</small></span>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onChangeAll(event.target.checked)}
          />
          <i aria-hidden="true" />
        </label>
      </div>
      <div className={styles.followList}>
        {visible.map((streamer) => {
          const preference = preferenceByChannel.get(streamer.channelId)!;
          return (
            <AlertRow
              key={streamer.channelId}
              streamer={streamer}
              preference={preference}
              onChange={onChange}
              onRemove={onRemove}
            />
          );
        })}
      </div>
      {!streamers.length && <p className={styles.personalEmpty}>내 알림 목록이 비어 있습니다.<br />스트리머 탭에서 검색해 추가하거나 원하는 스트리머를 제안해 주세요.</p>}
      <div className={styles.personalListActions}>
        <button onClick={onAdd}><Plus />알림 목록에 추가</button>
        <button onClick={onSuggest}><Send />스트리머 제안</button>
      </div>
      <UnsupportedList requests={unsupportedRequests} onSuggest={onSuggest} />
    </section>
  );
}
