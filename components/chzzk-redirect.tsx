"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import styles from "./chzzk-redirect.module.css";

export function ChzzkRedirect({ targetUrl, channelId }: { targetUrl: string; channelId: string }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("source") === "push") {
      trackEvent("push_opened", { channelId, source: "push" });
    }
    const timer = window.setTimeout(() => {
      window.location.assign(targetUrl);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [channelId, targetUrl]);

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.signal} aria-hidden="true"><span /></div>
        <p className={styles.eyebrow}>TRACKLINE · LIVE LINK</p>
        <h1>치지직 방송으로 이동합니다</h1>
        <p className={styles.description}>
          치지직 앱이 연결되어 있으면 앱으로, 그렇지 않으면 웹 방송 페이지로 이동합니다.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href={targetUrl}>치지직에서 바로 보기</a>
          <Link className={styles.secondary} href="/">TRACKLINE으로 돌아가기</Link>
        </div>
        <p className={styles.fallback} aria-live="polite">
          자동으로 이동하지 않으면 위 버튼을 눌러주세요.
        </p>
      </section>
    </main>
  );
}
