"use client";

import {
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  X
} from "lucide-react";
import { useRef, useState } from "react";
import type { MobilePlatform } from "@/lib/device";
import { trackEvent } from "@/lib/analytics";
import styles from "./mobile-app.module.css";

const guides = {
  ios: [
    {
      icon: Share,
      title: "Safari에서 공유 열기",
      body: "Safari 하단의 공유 버튼을 눌러 주세요.",
      browser: "Safari",
      action: "공유",
      hint: "하단 가운데 ↑ 버튼"
    },
    {
      icon: Smartphone,
      title: "홈 화면에 추가",
      body: "공유 목록을 위로 올리고 ‘홈 화면에 추가’를 선택합니다.",
      browser: "공유 메뉴",
      action: "홈 화면에 추가",
      hint: "＋ 아이콘이 있는 항목"
    },
    {
      icon: BellRing,
      title: "앱에서 알림 켜기",
      body: "홈 화면의 TRACKLINE을 열고 첫 화면의 알림 버튼을 누릅니다.",
      browser: "TRACKLINE",
      action: "변경 알림 켜기",
      hint: "알림 허용을 선택"
    }
  ],
  android: [
    {
      icon: MoreVertical,
      title: "Chrome 메뉴 열기",
      body: "Chrome 오른쪽 위의 점 세 개 메뉴를 눌러 주세요.",
      browser: "Chrome",
      action: "⋮ 메뉴",
      hint: "오른쪽 위 점 세 개"
    },
    {
      icon: Download,
      title: "앱 설치 선택",
      body: "메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택합니다.",
      browser: "Chrome 메뉴",
      action: "앱 설치",
      hint: "설치 확인을 한 번 더 눌러요"
    },
    {
      icon: BellRing,
      title: "앱에서 알림 켜기",
      body: "설치된 TRACKLINE을 열고 첫 화면의 알림 버튼을 누릅니다.",
      browser: "TRACKLINE",
      action: "변경 알림 켜기",
      hint: "알림 허용을 선택"
    }
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
  const [platform, setPlatform] = useState<"android" | "ios">(
    initialPlatform === "ios" ? "ios" : "android"
  );
  const [stepIndex, setStepIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const steps = guides[platform];
  const step = steps[stepIndex]!;

  function move(delta: number) {
    setStepIndex((current) => Math.min(steps.length - 1, Math.max(0, current + delta)));
  }

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
          <button className={platform === "android" ? styles.platformActive : ""} onClick={() => {
            setPlatform("android");
            setStepIndex(0);
          }}>Android</button>
          <button className={platform === "ios" ? styles.platformActive : ""} onClick={() => {
            setPlatform("ios");
            setStepIndex(0);
          }}>iPhone</button>
        </div>
        <div className={styles.guideNotice}>
          {installed ? <Check /> : <BellRing />}
          <div>
            <strong>{installed ? "앱으로 실행 중입니다" : "알림은 PWA 설치 후 사용할 수 있어요"}</strong>
            <p>아래 화면을 좌우로 넘겨 설치 순서를 확인하세요.</p>
          </div>
        </div>

        <div
          className={styles.guideCarousel}
          onPointerDown={(event) => {
            pointerStart.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (pointerStart.current === null) return;
            const distance = event.clientX - pointerStart.current;
            pointerStart.current = null;
            if (Math.abs(distance) > 42) move(distance < 0 ? 1 : -1);
          }}
        >
          <div className={styles.guideScreenshot} key={`${platform}-${stepIndex}`}>
            <div className={styles.shotStatus}><span>9:41</span><span>●●●</span></div>
            <div className={styles.shotBrowser}>
              <span>{step.browser}</span>
              <MoreVertical />
            </div>
            <div className={styles.shotApp}>
              <div className={styles.shotLogo}>T</div>
              <small>TRACKLINE</small>
              <strong>카테고리 변경을<br />놓치지 마세요</strong>
            </div>
            <div className={styles.shotAction}>
              <step.icon />
              <div><strong>{step.action}</strong><small>{step.hint}</small></div>
              <ChevronRight />
            </div>
          </div>
          <div className={styles.guideCaption}>
            <span>0{stepIndex + 1} / 0{steps.length}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </div>

        <div className={styles.guideControls}>
          <button onClick={() => move(-1)} disabled={stepIndex === 0} aria-label="이전 단계"><ChevronLeft /></button>
          <div>{steps.map((item, index) => (
            <button
              key={item.title}
              className={index === stepIndex ? styles.guideDotActive : ""}
              onClick={() => setStepIndex(index)}
              aria-label={`${index + 1}단계`}
            />
          ))}</div>
          <button onClick={() => move(1)} disabled={stepIndex === steps.length - 1} aria-label="다음 단계"><ChevronRight /></button>
        </div>

        {platform === "android" && canPrompt && !installed && (
          <button className={styles.installNow} onClick={() => {
            trackEvent("pwa_install_prompted");
            void onInstall();
          }}><Download /> 지금 앱 설치하기</button>
        )}
      </section>
    </div>
  );
}
