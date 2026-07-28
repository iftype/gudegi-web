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
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const pushConfig = useQuery({
    queryKey: ["push-config"],
    queryFn: ({ signal }) => api.pushConfig(signal),
    staleTime: 10 * 60_000
  });

  useEffect(() => {
    if (!subscriptionId || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.getRegistration().then(async (registration) => {
      const browserSubscription = await registration?.pushManager.getSubscription();
      if (!cancelled && !browserSubscription) {
        setSubscriptionId("");
        window.localStorage.removeItem(STORAGE_ID);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  useEffect(() => {
    if (!subscriptionId) return;
    const timer = window.setTimeout(() => {
      void api.savePushPreferences(subscriptionId, preferences).catch(() => {
        setMessage("기기 알림 설정을 동기화하지 못했습니다.");
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [preferences, subscriptionId]);

  async function enable(defaultChannelId?: string) {
    const selected = preferences.filter(
      (item) => item.enabled && (item.categoryChanged || item.titleChanged)
    );
    if (!selected.length && defaultChannelId) {
      selected.push({
        channelId: defaultChannelId,
        enabled: true,
        categoryChanged: true,
        titleChanged: true
      });
    }
    if (!selected.length) {
      setMessage("먼저 스트리머와 알림 종류를 선택해 주세요.");
      return false;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setMessage("이 브라우저에서는 푸시 알림을 사용할 수 없습니다.");
      return false;
    }
    setConnecting(true);
    setMessage("알림 서버를 확인하고 있습니다…");
    let stage = "서버 설정 확인";
    try {
      const configResult = pushConfig.data ?? (await pushConfig.refetch()).data;
      if (!configResult?.data.enabled || !configResult.data.publicKey) {
        setMessage("알림 서버 키가 아직 준비되지 않았습니다.");
        return false;
      }
      stage = "기기 권한 요청";
      setMessage("기기 알림 권한을 요청합니다…");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        trackEvent("notification_permission_denied");
        setMessage("알림 권한이 꺼져 있습니다. 휴대폰 설정에서 구데기 알림을 허용해 주세요.");
        return false;
      }
      stage = "서비스 워커 연결";
      setMessage("이 기기를 알림 서비스에 연결하고 있습니다…");
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      stage = "브라우저 푸시 등록";
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(configResult.data.publicKey)
      });
      stage = "서버 구독 저장";
      const result = await api.createPushSubscription(subscription.toJSON());
      stage = "알림 대상 저장";
      await api.savePushPreferences(result.data.id, selected);
      setSubscriptionId(result.data.id);
      window.localStorage.setItem(STORAGE_ID, result.data.id);
      trackEvent("notification_enabled", { channelId: selected[0]?.channelId });
      setMessage("이 앱에서 변경 알림을 받고 있습니다.");
      return true;
    } catch (error) {
      const detail = error instanceof DOMException && error.name === "NotAllowedError"
        ? "휴대폰 설정에서 알림 권한을 허용해 주세요."
        : error instanceof Error && error.message === "api_unavailable"
          ? "서버 응답이 없습니다. 잠시 후 다시 시도해 주세요."
          : "앱을 완전히 닫았다가 다시 열어 주세요.";
      setMessage(`${stage} 단계에서 실패했습니다. ${detail}`);
      return false;
    } finally {
      setConnecting(false);
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

  async function test() {
    if (!subscriptionId) {
      setMessage("먼저 이 기기의 알림을 켜 주세요.");
      return false;
    }
    setTesting(true);
    setMessage("테스트 알림을 보내고 있습니다…");
    try {
      await api.testPushSubscription(subscriptionId);
      setMessage("테스트 알림을 보냈습니다. 잠시 후 알림과 로그를 확인해 주세요.");
      return true;
    } catch {
      setMessage("테스트 전송에 실패했습니다. 알림을 껐다가 다시 연결해 주세요.");
      return false;
    } finally {
      setTesting(false);
    }
  }

  return {
    active: Boolean(subscriptionId),
    connecting,
    testing,
    message,
    enable,
    disable,
    test
  };
}

function base64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
