"use client";

import { useEffect, useState } from "react";
import { detectMobilePlatform, isStandalone, type MobilePlatform } from "@/lib/device";
import { trackEvent } from "@/lib/analytics";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<MobilePlatform>("other");

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      setInstalled(isStandalone());
      setPlatform(detectMobilePlatform(navigator.userAgent));
    }, 0);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      trackEvent("pwa_installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    trackEvent("pwa_install_prompted");
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
    return choice.outcome === "accepted";
  }

  return {
    installed,
    platform,
    canPrompt: Boolean(promptEvent),
    install
  };
}
