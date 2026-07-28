"use client";

import { api } from "./api";

export type AnalyticsEventName =
  | "page_view"
  | "pwa_install_prompted"
  | "pwa_installed"
  | "pwa_app_opened"
  | "notification_settings_opened"
  | "notification_preference_saved"
  | "notification_enabled"
  | "notification_permission_denied"
  | "notification_disabled"
  | "push_opened"
  | "calendar_streamer_selected"
  | "vod_opened"
  | "onboarding_viewed"
  | "guest_mode_selected"
  | "chzzk_login_started"
  | "chzzk_login_completed"
  | "streamer_picker_opened"
  | "pwa_guide_opened";

const ANONYMOUS_ID_KEY = "trackline-anonymous-id";
const ACQUISITION_SOURCE_KEY = "trackline-acquisition-source";

function getAnonymousId() {
  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return existing;
  const id = window.crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
  return id;
}

function getAcquisitionSource() {
  const existing = window.localStorage.getItem(ACQUISITION_SOURCE_KEY);
  if (existing) return existing;
  const query = new URLSearchParams(window.location.search);
  const tagged = query.get("utm_source")?.trim() || query.get("source")?.trim();
  let source = tagged?.slice(0, 80) || "direct";
  if (!tagged && document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin !== window.location.origin) source = referrer.hostname.slice(0, 80);
    } catch {
      source = "direct";
    }
  }
  window.localStorage.setItem(ACQUISITION_SOURCE_KEY, source);
  return source;
}

export function trackEvent(
  eventName: AnalyticsEventName,
  options: { channelId?: string; source?: string; path?: string } = {}
) {
  if (typeof window === "undefined") return;
  void api.trackAnalytics({
    anonymousId: getAnonymousId(),
    eventName,
    source: options.source ?? getAcquisitionSource(),
    channelId: options.channelId,
    path: options.path ?? window.location.pathname
  }).catch(() => {
    // 분석 실패가 사용자의 주요 기능을 막지 않게 한다.
  });
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}
