"use client";

import { CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { getAnonymousId } from "@/lib/analytics";
import styles from "./mobile-app.module.css";

export function SuggestionSheet({
  initialType,
  onSubmitted,
  onClose
}: {
  initialType: "idea" | "streamer_request";
  onSubmitted: () => void;
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
      await api.submitFeedback({
        category: type,
        streamerName: type === "streamer_request"
          ? String(form.get("streamerName") ?? "")
          : undefined,
        message: type === "idea" ? String(form.get("message") ?? "") : undefined,
        anonymousId: getAnonymousId(),
        website: String(form.get("website") ?? "")
      });
      onSubmitted();
      setStatus("sent");
    } catch {
      setMessage("제안을 보내지 못했습니다. 입력을 확인하고 다시 시도해 주세요.");
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
                <span>스트리머 이름</span>
                <input name="streamerName" minLength={1} maxLength={80} required placeholder="추가를 원하는 스트리머 이름" />
              </label>
            )}
            {type === "idea" && <label>
              <span>원하는 점</span>
              <textarea
                name="message"
                required
                minLength={5}
                maxLength={1000}
                placeholder="구데기에 바라는 점을 적어 주세요."
              />
            </label>}
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
