"use client";

import { ArrowRight, CloudDownload, HardDrive, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { authApi } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";
import styles from "./mobile-app.module.css";

export function OnboardingGate({
  onGuest
}: {
  user?: unknown;
  oauthConfigured?: boolean;
  onGuest: () => void;
}) {
  const [error, setError] = useState("");

  async function login() {
    setError("");
    try {
      window.localStorage.setItem("gudegi-import-all-after-login", "1");
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
      <div className={styles.onboardingBrand}><BrandMark /><span>구데기</span></div>
      <button className={styles.onboardingImport} onClick={() => void login()}>
        <CloudDownload /> 팔로우 불러오기
      </button>
      <div className={styles.onboardingCopy}>
        <span>CHZZK CHANGE ALERT</span>
        <h1>원하는 방송으로<br />바뀌는 순간 알려드려요.</h1>
        <p>원하는 스트리머의 카테고리 변경을 휴대폰 알림으로 확인하세요.</p>
      </div>
      <div className={styles.entryChoices}>
        <button className={styles.guestChoice} onClick={() => {
          trackEvent("guest_mode_selected");
          onGuest();
        }}>
          <span><HardDrive /><strong>비로그인으로 시작</strong></span>
          <small>이 브라우저에만 저장 · 데이터 삭제 시 복구 불가</small>
          <ArrowRight />
        </button>
      </div>
      <p className={styles.importDisclosure}>
        치지직 공식 API는 내가 팔로우한 채널 조회를 지원하지 않아, 불러오기를 누르면 구데기의 추적 채널 전체가 선택됩니다.
      </p>
      {error && <p className={styles.entryError}>{error}</p>}
      <div className={styles.onboardingPrivacy}>
        <ShieldCheck /><span>로그인해도 치지직 비밀번호는 전달받지 않습니다.</span>
      </div>
    </div>
  );
}
