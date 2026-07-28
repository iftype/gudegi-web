"use client";

import { Activity, ArrowRight, Cloud, HardDrive, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { authApi, type AppUser } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";
import styles from "./mobile-app.module.css";

export function OnboardingGate({
  user,
  oauthConfigured,
  onGuest
}: {
  user: AppUser | null;
  oauthConfigured: boolean;
  onGuest: () => void;
}) {
  const [error, setError] = useState("");

  async function login() {
    setError("");
    try {
      const result = await authApi.begin();
      trackEvent("chzzk_login_started");
      window.location.assign(result.data.authorizationUrl);
    } catch {
      setError("치지직 로그인용 비밀키가 아직 운영 서버에 설정되지 않았습니다.");
    }
  }

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingGlow} />
      <div className={styles.onboardingBrand}><Activity /><span>TRACKLINE</span></div>
      <div className={styles.onboardingCopy}>
        <span>CHZZK CHANGE ALERT</span>
        <h1>원하는 방송으로<br />바뀌는 순간 알려드려요.</h1>
        <p>팔로워 상위 스트리머의 카테고리와 방제 변경을 휴대폰 알림으로 확인하세요.</p>
      </div>
      <div className={styles.entryChoices}>
        <button className={styles.loginChoice} onClick={() => void login()} disabled={!oauthConfigured && Boolean(user)}>
          <span><LogIn /><strong>치지직 로그인</strong></span>
          <small><Cloud />선택한 알림 설정을 서버에 보관</small>
          <ArrowRight />
        </button>
        <button className={styles.guestChoice} onClick={() => {
          trackEvent("guest_mode_selected");
          onGuest();
        }}>
          <span><HardDrive /><strong>비로그인으로 시작</strong></span>
          <small>이 브라우저에만 저장 · 데이터 삭제 시 복구 불가</small>
          <ArrowRight />
        </button>
      </div>
      {error && <p className={styles.entryError}>{error}</p>}
      <div className={styles.onboardingPrivacy}>
        <ShieldCheck /><span>로그인해도 치지직 비밀번호는 전달받지 않습니다.</span>
      </div>
    </div>
  );
}
