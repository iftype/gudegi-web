"use client";

import { useEffect } from "react";
import { isStandalonePwa, trackEvent } from "@/lib/analytics";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        void navigator.serviceWorker.getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
          .then(() => {
            if (!navigator.serviceWorker.controller) return;
            const reloadKey = "gudegi-dev-service-worker-reset";
            if (sessionStorage.getItem(reloadKey)) return;
            sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
          })
          .catch(() => {
            // 개발 화면은 서비스 워커 없이도 계속 동작한다.
          });
      } else {
        void navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none"
        }).then((registration) => registration.update()).catch(() => {
          // 다음 앱 실행 또는 알림 연결 시 다시 등록한다.
        });
      }
    }
    if (isStandalonePwa()) trackEvent("pwa_app_opened");
  }, []);
  return null;
}
