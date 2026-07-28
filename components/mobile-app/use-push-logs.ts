"use client";

import { useCallback, useEffect, useState } from "react";
import { clearPushLogs, readPushLogs, type PushLogEntry } from "@/lib/push-log";

export function usePushLogs() {
  const [logs, setLogs] = useState<PushLogEntry[]>([]);

  const refresh = useCallback(async () => {
    setLogs(await readPushLogs());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "GUDEGI_PUSH_RECEIVED") void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  async function clear() {
    await clearPushLogs();
    setLogs([]);
  }

  return { logs, refresh, clear };
}
