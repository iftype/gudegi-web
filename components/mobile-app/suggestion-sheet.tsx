"use client";

import { CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { getAnonymousId } from "@/lib/analytics";
import type { UnsupportedStreamerRequest } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function SuggestionSheet({
  initialType,
  onSubmitted,
  onClose
}: {
  initialType: "idea" | "streamer_request";
  onSubmitted: (request?: UnsupportedStreamerRequest, supportedChannelId?: string) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.submitFeedback({
        category: type,
        targetChannel: type === "streamer_request"
          ? String(form.get("targetChannel") ?? "")
          : undefined,
        message: String(form.get("message") ?? ""),
        contact: String(form.get("contact") ?? ""),
        anonymousId: getAnonymousId(),
        website: String(form.get("website") ?? "")
      });
      const streamer = result.data.streamer;
      if (streamer) {
        onSubmitted(
          result.data.supported ? undefined : {
            id: result.data.id ?? Date.now(),
            ...streamer,
            requestCount: 1,
            requestedAt: Date.now()
          },
          result.data.supported ? streamer.channelId : undefined
        );
      } else {
        onSubmitted();
      }
      setStatus("sent");
    } catch (error) {
      setMessage(error instanceof Error && error.message === "channel_not_found"
        ? "해당 치지직 채널을 찾지 못했습니다."
        : "제안을 보내지 못했습니다. 입력을 확인하고 다시 시도해 주세요.");
      setStatus("error");
    }
  }

  return (
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`${styles.sheet} ${styles.suggestionSheet}`} role="dialog" aria-modal="true" aria-label="제안하기">
        <div className={styles.sheetHandle} />
        <header className={styles.sheetHeader}>
          <div><span>SUGGEST</span><h2>구데기에 제안하기</h2></div>
          <button onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        {status === "sent" ? (
          <div className={styles.suggestionSent}>
            <CheckCircle2 />
            <strong>제안을 받았습니다.</strong>
            <p>운영자가 확인할 수 있도록 안전하게 저장했어요.</p>
            <button onClick={onClose}>확인</button>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.suggestionForm}>
            <div className={styles.suggestionTypes}>
              <button type="button" className={type === "idea" ? styles.suggestionTypeActive : ""} onClick={() => setType("idea")}>서비스 제안</button>
              <button type="button" className={type === "streamer_request" ? styles.suggestionTypeActive : ""} onClick={() => setType("streamer_request")}>스트리머 추가</button>
            </div>
            {type === "streamer_request" && (
              <label>
                <span>치지직 채널 URL 또는 채널 ID</span>
                <input name="targetChannel" required placeholder="https://chzzk.naver.com/..." />
              </label>
            )}
            <label>
              <span>{type === "streamer_request" ? "추가 설명" : "원하는 점"}</span>
              <textarea
                name="message"
                required
                minLength={5}
                maxLength={1000}
                placeholder={type === "streamer_request" ? "이 스트리머를 추가해 주세요." : "구데기에 바라는 점을 적어 주세요."}
                defaultValue={type === "streamer_request" ? "이 스트리머를 수집 대상에 추가해 주세요." : ""}
              />
            </label>
            <label>
              <span>연락처 <small>선택</small></span>
              <input name="contact" maxLength={120} placeholder="이메일 또는 커뮤니티 닉네임" />
            </label>
            <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" />
            {status === "error" && <p className={styles.suggestionError}>{message}</p>}
            <button className={styles.suggestionSubmit} disabled={status === "sending"}>
              {status === "sending" ? <LoaderCircle className={styles.spinning} /> : <Send />}
              {status === "sending" ? "보내는 중" : "제안 보내기"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
