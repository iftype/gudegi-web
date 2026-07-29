"use client";

import { ArrowLeft, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import styles from "./feedback-experience.module.css";

export function FeedbackExperience() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    try {
      await api.submitFeedback({
        category: String(form.get("category")) as "idea" | "bug" | "usability" | "other",
        message: String(form.get("message")),
        contact: String(form.get("contact") ?? ""),
        website: String(form.get("website") ?? "")
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className={`${styles.shell} standalone-route`}>
      <header>
        <Link href="/"><ArrowLeft />구데기로 돌아가기</Link>
        <span>FEEDBACK</span>
      </header>
      {status === "sent" ? (
        <section className={styles.sent}>
          <CheckCircle2 />
          <h1>의견을 받았습니다.</h1>
          <p>보내주신 내용은 구데기 운영 서버의 관리자 화면에서 확인합니다.</p>
          <Link href="/">앱으로 돌아가기</Link>
        </section>
      ) : (
        <form onSubmit={submit}>
          <span className={styles.eyebrow}>TELL US WHAT HAPPENED</span>
          <h1>구데기를 더 쓰기 좋게<br />만들어 주세요.</h1>
          <p>오류, 불편한 흐름, 추가했으면 하는 기능을 편하게 남겨 주세요.</p>
          <label>
            <span>종류</span>
            <select name="category" defaultValue="usability">
              <option value="usability">사용하기 불편해요</option>
              <option value="bug">오류가 있어요</option>
              <option value="idea">기능 아이디어</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label>
            <span>내용</span>
            <textarea name="message" minLength={5} maxLength={1000} placeholder="어떤 상황에서 무엇이 불편했는지 알려 주세요." required />
          </label>
          <label>
            <span>답변 받을 연락처 <small>선택</small></span>
            <input name="contact" maxLength={120} placeholder="이메일 또는 커뮤니티 닉네임" />
          </label>
          <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" />
          {status === "error" && <p className={styles.error}>전송하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
          <button disabled={status === "sending"}>
            {status === "sending" ? <LoaderCircle className={styles.spin} /> : <Send />}
            {status === "sending" ? "보내는 중" : "피드백 보내기"}
          </button>
          <small className={styles.privacy}>연락처는 선택 사항이며 피드백 확인 외의 용도로 사용하지 않습니다.</small>
        </form>
      )}
    </main>
  );
}
