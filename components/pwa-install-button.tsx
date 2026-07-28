"use client";

import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { isStandalonePwa, trackEvent } from "@/lib/analytics";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standaloneTimer = window.setTimeout(() => setInstalled(isStandalonePwa()), 0);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
      trackEvent("pwa_installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(standaloneTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return <span className="button ghost install-complete"><Smartphone size={17} />앱으로 실행 중</span>;
  }

  async function install() {
    trackEvent("pwa_install_prompted");
    if (!promptEvent) {
      setShowHelp((visible) => !visible);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  }

  return (
    <div className="pwa-install">
      <button className="button ghost" onClick={() => void install()} aria-expanded={showHelp}>
        <Download size={17} />{promptEvent ? "앱 설치하기" : "설치 방법"}
      </button>
      {showHelp && (
        <div className="install-help" role="status">
          <button onClick={() => setShowHelp(false)} aria-label="설치 안내 닫기"><X /></button>
          <strong>휴대폰 홈 화면에 추가하세요</strong>
          <p>iPhone은 Safari 공유 버튼의 ‘홈 화면에 추가’, Android는 브라우저 메뉴의 ‘앱 설치’를 선택합니다.</p>
        </div>
      )}
    </div>
  );
}
