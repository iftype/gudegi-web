"use client";

import { BellRing, Check, Download, ExternalLink, MoreVertical, Share, Smartphone, X } from "lucide-react";
import { useState } from "react";
import type { MobilePlatform } from "@/lib/device";
import { trackEvent } from "@/lib/analytics";
import styles from "./mobile-app.module.css";

const guides = {
  ios: [
    { icon: ExternalLink, title: "Safari로 서비스 열기", body: "iPhone에서는 Safari에서 gudegi.vercel.app을 열어주세요." },
    { icon: Share, title: "공유 버튼 누르기", body: "하단의 공유 아이콘을 누르고 ‘홈 화면에 추가’를 선택하세요." },
    { icon: Smartphone, title: "홈 화면 앱으로 실행", body: "추가된 TRACKLINE 아이콘을 눌러 앱 모드로 실행하세요." },
    { icon: BellRing, title: "알림 탭에서 권한 허용", body: "스트리머와 변경 종류를 선택한 뒤 알림을 켜세요." }
  ],
  android: [
    { icon: ExternalLink, title: "Chrome으로 서비스 열기", body: "Android에서는 Chrome에서 gudegi.vercel.app을 열어주세요." },
    { icon: MoreVertical, title: "앱 설치 선택", body: "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 누르세요." },
    { icon: Smartphone, title: "설치된 앱으로 실행", body: "홈 화면의 TRACKLINE 아이콘을 눌러 실행하세요." },
    { icon: BellRing, title: "알림 탭에서 권한 허용", body: "스트리머와 변경 종류를 고른 뒤 알림을 켜세요." }
  ],
  other: [
    { icon: Smartphone, title: "휴대폰에서 접속", body: "iPhone Safari 또는 Android Chrome으로 접속하세요." },
    { icon: Download, title: "홈 화면에 앱 설치", body: "브라우저의 설치 메뉴를 이용해 TRACKLINE을 추가하세요." },
    { icon: BellRing, title: "앱에서 알림 켜기", body: "설치된 앱을 실행해야 푸시 알림을 설정할 수 있습니다." }
  ]
} as const;

export function GuideSheet({
  initialPlatform,
  canPrompt,
  installed,
  onInstall,
  onClose
}: {
  initialPlatform: MobilePlatform;
  canPrompt: boolean;
  installed: boolean;
  onInstall: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<MobilePlatform>(initialPlatform);
  const steps = guides[platform];

  return (
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`${styles.sheet} ${styles.guideSheet}`} role="dialog" aria-modal="true" aria-label="사용 방법">
        <div className={styles.sheetHandle} />
        <header className={styles.sheetHeader}>
          <div><span>QUICK START</span><h2>설치 및 사용 방법</h2></div>
          <button onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        <div className={styles.platformTabs}>
          <button className={platform === "android" ? styles.platformActive : ""} onClick={() => setPlatform("android")}>Android</button>
          <button className={platform === "ios" ? styles.platformActive : ""} onClick={() => setPlatform("ios")}>iPhone</button>
        </div>
        <div className={styles.guideNotice}>
          {installed ? <Check /> : <BellRing />}
          <div>
            <strong>{installed ? "앱으로 실행 중입니다" : "알림은 PWA 설치 후 사용할 수 있어요"}</strong>
            <p>브라우저 탭이 아니라 홈 화면에 설치된 TRACKLINE에서 알림 권한을 요청합니다.</p>
          </div>
        </div>
        <ol className={styles.guideSteps}>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <step.icon />
              <div><strong>{step.title}</strong><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
        {platform === "android" && canPrompt && !installed && (
          <button className={styles.installNow} onClick={() => {
            trackEvent("pwa_guide_opened");
            void onInstall();
          }}><Download /> 지금 앱 설치하기</button>
        )}
      </section>
    </div>
  );
}
