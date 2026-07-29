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
import Image from "next/image";
import { useState } from "react";
import type { MobilePlatform } from "@/lib/device";
import { GUIDE_SCREENSHOTS } from "./guide-assets";
import styles from "./mobile-app.module.css";

const guides = {
  ios: [
    {
      icon: Share,
      title: "Safari 메뉴에서 공유",
      body: "반드시 iPhone의 기본 Safari로 구데기 페이지를 연 뒤 아래쪽 ‘공유’ 버튼을 눌러 주세요.",
      browser: "Safari",
      action: "공유",
      hint: "공유 아이콘이 있는 첫 항목",
      imageSrc: GUIDE_SCREENSHOTS.ios[0]
    },
    {
      icon: Smartphone,
      title: "공유 시트를 펼치기",
      body: "공유 화면 아래쪽의 ‘더 보기’를 누르거나 시트를 위로 끌어올립니다.",
      browser: "공유 메뉴",
      action: "더 보기",
      hint: "아래쪽 화살표",
      imageSrc: GUIDE_SCREENSHOTS.ios[1]
    },
    {
      icon: Smartphone,
      title: "홈 화면에 추가",
      body: "펼친 목록에서 ‘홈 화면에 추가’를 선택해 주세요.",
      browser: "공유 메뉴",
      action: "홈 화면에 추가",
      hint: "＋ 아이콘이 있는 항목",
      imageSrc: GUIDE_SCREENSHOTS.ios[2]
    },
    {
      icon: BellRing,
      title: "웹 앱으로 열고 추가",
      body: "‘웹 앱으로 열기’를 켠 상태로 오른쪽 위 ‘추가’를 누른 뒤, 홈 화면의 구데기에서 알림을 켜세요.",
      browser: "홈 화면에 추가",
      action: "추가",
      hint: "웹 앱으로 열기 켜짐",
      imageSrc: GUIDE_SCREENSHOTS.ios[3]
    }
  ],
  android: [
    {
      icon: MoreVertical,
      title: "삼성 브라우저에서 열기",
      body: "Chrome이나 카카오톡 안에서 열었다면 메뉴를 누른 뒤 ‘삼성 브라우저에서 열기’를 선택하세요.",
      browser: "Chrome",
      action: "삼성 브라우저에서 열기",
      hint: "Chrome 오른쪽 위 메뉴",
      imageSrc: GUIDE_SCREENSHOTS.android[0]
    },
    {
      icon: Download,
      title: "웹 애플리케이션 설치",
      body: "삼성 인터넷에서 주소창 오른쪽의 설치 아이콘을 누르고 ‘웹 애플리케이션 설치’를 선택하세요.",
      browser: "삼성 인터넷",
      action: "웹 애플리케이션 설치",
      hint: "주소창 오른쪽 다운로드 모양",
      imageSrc: GUIDE_SCREENSHOTS.android[1]
    },
    {
      icon: Check,
      title: "경고에서 설치 계속하기",
      body: "Play Protect 화면이 나오면 ‘무시하고 설치하기’를 누른 뒤 확인하세요. 설치된 구데기를 열어 알림을 연결하면 됩니다.",
      browser: "Google Play 프로텍트",
      action: "무시하고 설치하기",
      hint: "아래 확인 버튼까지 누르기",
      imageSrc: GUIDE_SCREENSHOTS.android[2]
    }
  ]
} as const;

export function GuideSheet({
  initialPlatform,
  canPrompt,
  installed,
  onInstall,
  onEnable,
  onClose
}: {
  initialPlatform: MobilePlatform;
  canPrompt: boolean;
  installed: boolean;
  onInstall: () => Promise<boolean>;
  onEnable: () => void;
  onClose: () => void;
}) {
  const platform = initialPlatform === "ios" ? "ios" : "android";
  const [stepIndex, setStepIndex] = useState(0);
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
          <button type="button" onClick={onClose} aria-label="닫기"><X /></button>
        </header>
        <div className={styles.guideNavigation}>
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={stepIndex === 0}
            aria-label="이전 단계"
          ><ChevronLeft /></button>
          <strong>{stepIndex + 1} / {steps.length}</strong>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={stepIndex === steps.length - 1}
            aria-label="다음 단계"
          ><ChevronRight /></button>
        </div>

        <div
          className={styles.guideCarousel}
          data-testid="guide-carousel"
        >
          <div className={styles.guideScreenshot} key={`${platform}-${stepIndex}`}>
            {step.imageSrc ? (
              <Image
                className={styles.guidePhoto}
                src={step.imageSrc}
                alt={`${step.title} 실제 기기 화면`}
                width={390}
                height={844}
                sizes="210px"
              />
            ) : (
              <>
                <div className={styles.shotStatus}><span>9:41</span><span>●●●</span></div>
                <div className={styles.shotBrowser}>
                  <span>{step.browser}</span>
                  <MoreVertical />
                </div>
                <div className={styles.shotApp}>
                  <div className={styles.shotLogo}>구</div>
                  <small>구데기</small>
                  <strong>카테고리 변경을<br />놓치지 마세요</strong>
                </div>
                <div className={styles.shotAction}>
                  <step.icon />
                  <div><strong>{step.action}</strong><small>{step.hint}</small></div>
                  <ChevronRight />
                </div>
              </>
            )}
          </div>
          <div className={styles.guideCaption}>
            <span>0{stepIndex + 1} / 0{steps.length}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </div>

        <div className={styles.guideControls}>
          <div>{steps.map((item, index) => (
            <button
              type="button"
              key={item.title}
              className={index === stepIndex ? styles.guideDotActive : ""}
              onClick={() => setStepIndex(index)}
              aria-label={`${index + 1}단계`}
            />
          ))}</div>
        </div>

        {stepIndex === steps.length - 1 && (
          <button
            type="button"
            className={styles.installNow}
            onClick={() => {
              if (installed) {
                onEnable();
                onClose();
                return;
              }
              if (canPrompt) {
                void onInstall();
                return;
              }
              onClose();
            }}
          >
            {installed
              ? <><BellRing />알림 받기</>
              : canPrompt
                ? <><Download />지금 앱 설치하기</>
                : <><Smartphone />설치 후 구데기 앱에서 알림 받기</>}
          </button>
        )}
      </section>
    </div>
  );
}
