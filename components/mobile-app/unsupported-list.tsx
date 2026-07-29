"use client";

import { CircleSlash2, RefreshCw, Send } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { UnsupportedStreamerRequest } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function UnsupportedList({
  requests,
  onSuggest,
  onSuggestUnsupported = async () => undefined
}: {
  requests: UnsupportedStreamerRequest[];
  onSuggest: () => void;
  onSuggestUnsupported?: (streamerName: string) => Promise<void>;
}) {
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  if (!requests.length) return null;
  return (
    <section className={styles.unsupportedSection}>
      <header>
        <div><CircleSlash2 /><strong>현재 미지원</strong></div>
        <span>{requests.length}명</span>
      </header>
      <p>아직 수집하고 있지 않아 알림·달력·다시보기를 지원하지 않습니다.</p>
      <div>
        {requests.map((request) => (
          <article key={request.channelId}>
            <span className={styles.rowAvatar}>
              {request.channelImageUrl
                ? <Image src={request.channelImageUrl} alt="" width={46} height={46} />
                : request.channelName.slice(0, 1)}
            </span>
            <span>
              <strong>{request.channelName}</strong>
              <small>{sent.includes(request.channelId) ? "수집 제안을 보냈습니다" : "현재 수집하지 않아 미지원"}</small>
            </span>
            <button
              disabled={sending === request.channelId || sent.includes(request.channelId)}
              onClick={async () => {
                setSending(request.channelId);
                try {
                  await onSuggestUnsupported(request.channelName);
                  setSent((current) => [...current, request.channelId]);
                } finally {
                  setSending(null);
                }
              }}
            >
              {sending === request.channelId ? <RefreshCw className={styles.spinning} /> : <Send />}
              {sent.includes(request.channelId) ? "제안 완료" : "수집 제안"}
            </button>
          </article>
        ))}
      </div>
      <button onClick={onSuggest}><Send />다른 스트리머 제안하기</button>
    </section>
  );
}
