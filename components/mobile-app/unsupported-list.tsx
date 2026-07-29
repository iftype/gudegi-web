"use client";

import { CircleSlash2, Send } from "lucide-react";
import Image from "next/image";
import type { UnsupportedStreamerRequest } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function UnsupportedList({
  requests,
  onSuggest
}: {
  requests: UnsupportedStreamerRequest[];
  onSuggest: () => void;
}) {
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
              <small>제안 완료 · 현재 미지원</small>
            </span>
          </article>
        ))}
      </div>
      <button onClick={onSuggest}><Send />다른 스트리머 제안하기</button>
    </section>
  );
}
