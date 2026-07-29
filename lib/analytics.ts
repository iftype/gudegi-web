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
const SELF_HOSTED_EVENTS = new Set<AnalyticsEventName>([
  "page_view",
  "pwa_installed",
  "pwa_app_opened"
]);

export function getAnonymousId() {
  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return existing;
  const id = window.crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
  return id;
}

export function trackEvent(
  eventName: AnalyticsEventName,
  _options: { channelId?: string; source?: string; path?: string } = {}
) {
  void _options;
  if (typeof window === "undefined" || !SELF_HOSTED_EVENTS.has(eventName)) return;
  void api.trackAnalytics({
    anonymousId: getAnonymousId(),
    eventName
  }).catch(() => {
    // 분석 실패가 사용자의 주요 기능을 막지 않게 한다.
  });
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}
