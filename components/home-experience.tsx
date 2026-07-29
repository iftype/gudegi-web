"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MobileApp } from "./mobile-app/mobile-app";

export function HomeExperience() {
  const streamers = useQuery({
    queryKey: ["streamers"],
    queryFn: ({ signal }) => api.streamers(signal),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5_000
  });

  if (streamers.isLoading) {
    return (
      <main className="mobile-app-state standalone-route">
        <RefreshCw />
        <strong>구데기를 준비하고 있어요</strong>
        <span>스트리머 상태를 불러오는 중입니다.</span>
      </main>
    );
  }
  if (streamers.isError || !streamers.data?.data.length) {
    return (
      <main className="mobile-app-state error standalone-route">
        <Activity />
        <strong>추적 서버에 연결할 수 없어요</strong>
        <span>잠시 후 다시 열어주세요.</span>
        <button onClick={() => void streamers.refetch()}>다시 시도</button>
      </main>
    );
  }
  return <MobileApp streamers={streamers.data.data} />;
}
