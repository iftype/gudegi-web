"use client";

import { Activity, ArrowLeft, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";
import styles from "./login-experience.module.css";

export function LoginExperience() {
  const search = useSearchParams();
  const router = useRouter();
  const attempted = useRef(false);
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");
  const code = search.get("code");
  const oauthState = search.get("state");
  const oauthError = search.get("error");

  useEffect(() => {
    if (!code || !oauthState || attempted.current) return;
    attempted.current = true;
    setState("working");
    authApi.complete(code, oauthState).then(() => {
      window.localStorage.setItem("gudegi-entry-mode", "login");
      trackEvent("chzzk_login_completed");
      router.replace("/");
    }).catch(() => {
      setMessage("로그인을 완료하지 못했습니다. 인증 시간이 지났다면 다시 시도해 주세요.");
      setState("error");
    });
  }, [code, oauthState, router]);

  async function startLogin() {
    setState("working");
    setMessage("");
    try {
      const result = await authApi.begin();
      trackEvent("chzzk_login_started");
      window.location.assign(result.data.authorizationUrl);
    } catch {
      setState("error");
      setMessage("치지직 로그인이 아직 준비되지 않았습니다. 운영 비밀키 설정을 확인해 주세요.");
    }
  }

  const processing = Boolean(code && oauthState) && state !== "error";

  return (
    <main className={`${styles.shell} standalone-route`}>
      <section className={styles.card}>
        <div className={styles.brand}><Activity /><span>구데기</span></div>
        {processing ? (
          <>
            <LoaderCircle className={styles.spin} size={38} />
            <h1>치지직 로그인 중</h1>
            <p>인증 정보를 안전하게 확인하고 있습니다. 잠시만 기다려 주세요.</p>
          </>
        ) : (
          <>
            <span className={styles.icon}><ShieldCheck /></span>
            <h1>{oauthError ? "로그인이 취소됐어요" : "설정을 안전하게 보관하세요"}</h1>
            <p>로그인하면 선택한 스트리머와 알림 종류가 다른 기기에서도 유지됩니다.</p>
            <button onClick={() => void startLogin()} disabled={state === "working"}>
              {state === "working" ? <LoaderCircle className={styles.spin} /> : <ExternalLink />}
              치지직으로 로그인
            </button>
            <Link href="/"><ArrowLeft /> 비로그인으로 돌아가기</Link>
          </>
        )}
        {(message || oauthError) && (
          <div className={styles.error}>{message || "치지직에서 로그인이 취소되었습니다."}</div>
        )}
        <small>비밀번호는 구데기에 전달되지 않습니다.</small>
      </section>
    </main>
  );
}
