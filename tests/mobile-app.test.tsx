import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuideSheet } from "@/components/mobile-app/guide-sheet";
import { OnboardingGate } from "@/components/mobile-app/onboarding-gate";
import { StreamersTab } from "@/components/mobile-app/streamers-tab";
import { api } from "@/lib/api";
import type { Streamer } from "@/lib/types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const streamers: Streamer[] = [
  {
    channelId: "a".repeat(32),
    channelName: "라이브 스트리머",
    channelImageUrl: null,
    enabled: true,
    isLive: true,
    activeBroadcastId: null,
    collectorState: "tracking",
    lastCheckedAt: null,
    followerCount: 10_000,
    trackingRank: 1
  },
  {
    channelId: "b".repeat(32),
    channelName: "오프라인 스트리머",
    channelImageUrl: null,
    enabled: true,
    isLive: false,
    activeBroadcastId: null,
    collectorState: "idle",
    lastCheckedAt: null,
    followerCount: 9_000,
    trackingRank: 2
  }
];

describe("mobile-first entry and guidance", () => {
  it("clearly offers login and local-only guest mode", () => {
    const onGuest = vi.fn();
    render(<OnboardingGate user={null} oauthConfigured={true} onGuest={onGuest} />);

    expect(screen.getByRole("button", { name: /치지직 로그인/ })).toBeInTheDocument();
    expect(screen.getByText(/이 브라우저에만 저장/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /비로그인으로 시작/ }));
    expect(onGuest).toHaveBeenCalledOnce();
  });

  it("selects live or all streamers inline without a modal", async () => {
    const onSelect = vi.fn();
    vi.spyOn(api, "streamerBroadcasts").mockResolvedValue({ data: [] });
    vi.spyOn(api, "monthlyStreamer").mockResolvedValue({
      data: {
        month: "2026-07",
        timezone: "Asia/Seoul",
        broadcasts: [],
        categoryDurations: [],
        totalDurationMs: 0,
        dayStatuses: [{ date: "2026-07-29", status: "broadcast" }]
      }
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    render(
      <QueryClientProvider client={queryClient}>
        <StreamersTab
          streamers={streamers}
          selected={streamers[0]!}
          preference={{
            channelId: streamers[0]!.channelId,
            enabled: true,
            categoryChanged: true,
            titleChanged: true
          }}
          onSelect={onSelect}
          onChange={() => undefined}
        />
      </QueryClientProvider>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "오프라인 스트리머" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "전체" }));
    fireEvent.click(screen.getByRole("button", { name: "오프라인 스트리머" }));
    expect(onSelect).toHaveBeenCalledWith(streamers[1]!.channelId);
    expect(await screen.findByText("방송일 1일 · 다시보기 0개")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "알림" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카테고리" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "방제" })).toBeInTheDocument();
  });

  it("shows different Android and iPhone installation steps", () => {
    render(
      <GuideSheet
        initialPlatform="android"
        canPrompt={false}
        installed={false}
        onInstall={async () => false}
        onClose={() => undefined}
      />
    );
    expect(screen.getByText("Chrome 메뉴 열기")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "iPhone" }));
    expect(screen.getByText("Safari에서 공유 열기")).toBeInTheDocument();
    expect(screen.getByText(/PWA 설치 후/)).toBeInTheDocument();
  });
});
