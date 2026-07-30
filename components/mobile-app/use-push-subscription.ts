"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
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
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const pushConfig = useQuery({
    queryKey: ["push-config"],
    queryFn: ({ signal }) => api.pushConfig(signal),
    staleTime: 10 * 60_000
  });
  const capable = typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "Notification" in window;
  const clearMessage = useCallback(() => setMessage(""), []);

  useEffect(() => {
    if (!subscriptionId || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.getRegistration().then(async (registration) => {
      const browserSubscription = await registration?.pushManager.getSubscription();
      if (!cancelled && !browserSubscription) {
        setSubscriptionId("");
        window.localStorage.removeItem(STORAGE_ID);
        setMessage("기기 알림 연결이 만료되었습니다. 다시 연결해 주세요.");
        return;
      }
      try {
        await api.pushSubscriptionStatus(subscriptionId);
      } catch (error) {
        if (!cancelled && error instanceof Error && error.message === "not_found") {
          setSubscriptionId("");
          window.localStorage.removeItem(STORAGE_ID);
          setMessage("서버의 기기 등록이 만료되었습니다. 알림을 다시 연결해 주세요.");
        }
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

  async function enable() {
    const selected = preferences.filter(
      (item) => item.enabled && (item.liveStarted || item.categoryChanged || item.titleChanged)
    );
    if (!selected.length) {
      setMessage("먼저 스트리머와 알림 종류를 선택해 주세요.");
      return false;
    }
    if (!capable) {
      setMessage("이 브라우저에서는 푸시 알림을 사용할 수 없습니다.");
      return false;
    }
    setConnecting(true);
    let stage = "기기 권한 요청";
    try {
      // iOS PWA는 사용자 클릭과 같은 동기 이벤트 안에서 권한 요청을 시작해야 한다.
      // 네트워크 요청보다 먼저 호출해 transient user activation을 잃지 않게 한다.
      setMessage("기기 알림 권한을 요청합니다…");
      const permissionRequest = Notification.permission === "default"
        ? Notification.requestPermission()
        : Promise.resolve(Notification.permission);
      const permission = await permissionRequest;
      setPermission(permission);
      if (permission !== "granted") {
        trackEvent("notification_permission_denied");
        setMessage("알림 권한이 꺼져 있습니다. 휴대폰 설정에서 구데기 알림을 허용해 주세요.");
        return false;
      }

      stage = "서버 설정 확인";
      setMessage("알림 서버를 확인하고 있습니다…");
      const configResult = pushConfig.data ?? (await pushConfig.refetch()).data;
      if (!configResult?.data.enabled || !configResult.data.publicKey) {
        setMessage("알림 서버 키가 아직 준비되지 않았습니다.");
        return false;
      }

      stage = "서비스 워커 연결";
      setMessage("이 기기를 알림 서비스에 연결하고 있습니다…");
      const worker = await navigator.serviceWorker.register("/sw.js", {
        updateViaCache: "none"
      });
      await worker.update().catch(() => undefined);
      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        setMessage("설치된 PWA 앱에서만 푸시 알림을 연결할 수 있습니다.");
        return false;
      }
      stage = "브라우저 푸시 등록";
      const applicationServerKey = base64ToUint8Array(configResult.data.publicKey);
      let subscription = await registration.pushManager.getSubscription();
      // 직전 연결 테스트가 실패하면 서버 ID는 저장되지 않지만 브라우저 구독은
      // 남을 수 있다. 같은 만료 endpoint를 재사용하지 않고 새로 발급받는다.
      if (subscription && !subscriptionId) {
        await subscription.unsubscribe();
        subscription = null;
      }
      if (subscription && !applicationServerKeysMatch(
        subscription.options.applicationServerKey,
        applicationServerKey
      )) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      stage = "서버 구독 저장";
      const result = await api.createPushSubscription(serializeSubscription(subscription));
      stage = "알림 대상 저장";
      await api.savePushPreferences(result.data.id, selected);
      stage = "연결 테스트";
      setMessage("연결을 확인하는 테스트 알림을 보내고 있습니다…");
      await api.testPushSubscription(result.data.id);
      setSubscriptionId(result.data.id);
      window.localStorage.setItem(STORAGE_ID, result.data.id);
      trackEvent("notification_enabled", { channelId: selected[0]?.channelId });
      setMessage("연결됐습니다. 방금 보낸 테스트 알림을 확인해 주세요.");
      return true;
    } catch (error) {
      const detail = pushErrorMessage(error);
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
    } catch (error) {
      if (error instanceof Error && error.message === "not_found") {
        setSubscriptionId("");
        window.localStorage.removeItem(STORAGE_ID);
        setMessage("기기 등록이 만료되었습니다. 알림을 다시 연결해 주세요.");
      } else {
        setMessage("테스트 전송에 실패했습니다. 알림을 껐다가 다시 연결해 주세요.");
      }
      return false;
    } finally {
      setTesting(false);
    }
  }

  return {
    active: Boolean(subscriptionId),
    capable,
    connecting,
    testing,
    permission,
    message,
    clearMessage,
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

function applicationServerKeysMatch(
  current: ArrayBuffer | null,
  expected: Uint8Array<ArrayBuffer>
) {
  if (!current) return false;
  const currentBytes = new Uint8Array(current);
  return currentBytes.length === expected.length
    && currentBytes.every((value, index) => value === expected[index]);
}

function serializeSubscription(subscription: PushSubscription): PushSubscriptionJSON {
  const json = subscription.toJSON();
  const encodeKey = (name: PushEncryptionKeyName) => {
    const key = subscription.getKey(name);
    if (!key) return "";
    const binary = String.fromCharCode(...new Uint8Array(key));
    return window.btoa(binary)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
  };
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: json.keys?.p256dh || encodeKey("p256dh"),
      auth: json.keys?.auth || encodeKey("auth")
    }
  };
}

function pushErrorMessage(error: unknown) {
  if (error instanceof Error && (error as Error & { status?: number }).status === 429) {
    return "테스트 요청이 너무 잦습니다. 1분 뒤 다시 시도해 주세요.";
  }
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "휴대폰 설정에서 구데기 알림을 허용해 주세요.";
    }
    if (error.name === "InvalidStateError" || error.name === "AbortError") {
      return "기존 알림 연결을 복구하지 못했습니다. 앱을 완전히 닫았다가 다시 열어 주세요.";
    }
  }
  if (error instanceof Error && error.message === "not_found") {
    return "서버 등록이 만료되었습니다. 다시 연결해 주세요.";
  }
  if (error instanceof Error && error.message === "api_unavailable") {
    return "서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (error instanceof Error && error.message === "push_delivery_failed") {
    const diagnostic = error as Error & {
      failureStatusCode?: number;
      failureCode?: string;
    };
    const statusCode = diagnostic.failureStatusCode;
    const failureCode = diagnostic.failureCode || "unknown_push_error";
    return statusCode
      ? `휴대폰 푸시 제공자가 전송을 거절했습니다(${statusCode}). 다시 연결해 주세요.`
      : `푸시 암호화 준비 중 실패했습니다(진단: ${failureCode}). 다시 연결해 주세요.`;
  }
  return "앱을 완전히 닫았다가 다시 열어 주세요.";
}
