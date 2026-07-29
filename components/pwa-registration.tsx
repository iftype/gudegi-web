"use client";

import { useEffect } from "react";
import { isStandalonePwa, trackEvent } from "@/lib/analytics";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", {
        updateViaCache: "none"
      }).then((registration) => registration.update()).catch(() => {
        // 다음 앱 실행 또는 알림 연결 시 다시 등록한다.
      });
    }
    if (isStandalonePwa()) trackEvent("pwa_app_opened");
  }, []);
  return null;
}
