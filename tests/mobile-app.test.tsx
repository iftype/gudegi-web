import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuideSheet } from "@/components/mobile-app/guide-sheet";
import { OnboardingGate } from "@/components/mobile-app/onboarding-gate";
import { StreamerPickerSheet } from "@/components/mobile-app/streamer-picker-sheet";
import type { Streamer } from "@/lib/types";

afterEach(() => {
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

  it("uses a searchable choice dialog instead of a select element", () => {
    const onSelect = vi.fn();
    render(
      <StreamerPickerSheet
        streamers={streamers}
        selectedChannelId={streamers[0]!.channelId}
        onSelect={onSelect}
        onClose={() => undefined}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "스트리머 선택" });
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText("스트리머 검색"), {
      target: { value: "오프라인" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /오프라인 스트리머/ }));
    expect(onSelect).toHaveBeenCalledWith(streamers[1]!.channelId);
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
    expect(screen.getByText("Chrome으로 서비스 열기")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "iPhone" }));
    expect(screen.getByText("Safari로 서비스 열기")).toBeInTheDocument();
    expect(screen.getByText(/PWA 설치 후/)).toBeInTheDocument();
  });
});
