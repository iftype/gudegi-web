"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import type { PushPreference } from "@/lib/types";

const STORAGE_ID = "trackline-push-subscription-id";

export function usePushSubscription(preferences: PushPreference[]) {
  const [subscriptionId, setSubscriptionId] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(STORAGE_ID) ?? ""
  );
  const [message, setMessage] = useState("");
  const pushConfig = useQuery({
    queryKey: ["push-config"],
    queryFn: ({ signal }) => api.pushConfig(signal),
    staleTime: 10 * 60_000
  });

  useEffect(() => {
    if (!subscriptionId) return;
    const timer = window.setTimeout(() => {
      void api.savePushPreferences(subscriptionId, preferences).catch(() => {
        setMessage("기기 알림 설정을 동기화하지 못했습니다.");
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [preferences, subscriptionId]);

  async function enable() {
    const selected = preferences.filter(
      (item) => item.enabled && (item.categoryChanged || item.titleChanged)
    );
    if (!selected.length) {
      setMessage("먼저 스트리머와 알림 종류를 선택해 주세요.");
      return false;
    }
    if (!pushConfig.data?.data.enabled || !pushConfig.data.data.publicKey) {
      setMessage("푸시 서버 설정을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.");
      return false;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("이 브라우저에서는 푸시 알림을 사용할 수 없습니다.");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      trackEvent("notification_permission_denied");
      setMessage("알림 권한을 허용해야 변경 알림을 받을 수 있습니다.");
      return false;
    }
    try {
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(pushConfig.data.data.publicKey)
      });
      const result = await api.createPushSubscription(subscription.toJSON());
      await api.savePushPreferences(result.data.id, selected);
      setSubscriptionId(result.data.id);
      window.localStorage.setItem(STORAGE_ID, result.data.id);
      trackEvent("notification_enabled", { channelId: selected[0]?.channelId });
      setMessage("이 앱에서 변경 알림을 받고 있습니다.");
      return true;
    } catch {
      setMessage("알림 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.");
      return false;
    }
  }

  async function disable() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      if (subscriptionId) await api.deletePushSubscription(subscriptionId);
    } finally {
      setSubscriptionId("");
      window.localStorage.removeItem(STORAGE_ID);
      trackEvent("notification_disabled");
      setMessage("이 앱의 알림을 껐습니다.");
    }
  }

  return {
    active: Boolean(subscriptionId),
    message,
    enable,
    disable
  };
}

function base64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
