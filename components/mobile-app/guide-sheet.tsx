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
import { useRef, useState } from "react";
import type { MobilePlatform } from "@/lib/device";
import { trackEvent } from "@/lib/analytics";
import { GUIDE_SCREENSHOTS } from "./guide-assets";
import styles from "./mobile-app.module.css";

const guides = {
  ios: [
    {
      icon: Share,
      title: "Safari 메뉴에서 공유",
      body: "구데기 페이지를 연 뒤 Safari 메뉴에서 ‘공유’를 눌러 주세요.",
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
      title: "Chrome 메뉴 열기",
      body: "Chrome 오른쪽 위의 점 세 개 메뉴를 눌러 주세요.",
      browser: "Chrome",
      action: "⋮ 메뉴",
      hint: "오른쪽 위 점 세 개",
      imageSrc: GUIDE_SCREENSHOTS.android[0]
    },
    {
      icon: Download,
      title: "앱 설치 선택",
      body: "메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택합니다.",
      browser: "Chrome 메뉴",
      action: "앱 설치",
      hint: "설치 확인을 한 번 더 눌러요",
      imageSrc: GUIDE_SCREENSHOTS.android[1]
    },
    {
      icon: BellRing,
      title: "앱에서 알림 켜기",
      body: "설치된 구데기를 열고 첫 화면의 알림 버튼을 누릅니다.",
      browser: "구데기",
      action: "변경 알림 켜기",
      hint: "알림 허용을 선택",
      imageSrc: GUIDE_SCREENSHOTS.android[2]
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
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
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
          data-testid="guide-carousel"
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (pointerStart.current === null) return;
            const distanceX = event.clientX - pointerStart.current.x;
            const distanceY = event.clientY - pointerStart.current.y;
            pointerStart.current = null;
            if (distanceY > 72 && Math.abs(distanceY) > Math.abs(distanceX)) {
              onClose();
              return;
            }
            if (Math.abs(distanceX) > 42) move(distanceX < 0 ? 1 : -1);
          }}
        >
          <button className={styles.guideArrowLeft} onClick={() => move(-1)} disabled={stepIndex === 0} aria-label="이전 단계"><ChevronLeft /></button>
          <button className={styles.guideArrowRight} onClick={() => move(1)} disabled={stepIndex === steps.length - 1} aria-label="다음 단계"><ChevronRight /></button>
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
              key={item.title}
              className={index === stepIndex ? styles.guideDotActive : ""}
              onClick={() => setStepIndex(index)}
              aria-label={`${index + 1}단계`}
            />
          ))}</div>
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
