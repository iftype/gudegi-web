"use client";

import { useEffect } from "react";
import { isStandalonePwa, trackEvent } from "@/lib/analytics";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    if (isStandalonePwa()) trackEvent("pwa_app_opened");
  }, []);
  return null;
}
