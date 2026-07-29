import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuideSheet } from "@/components/mobile-app/guide-sheet";
import { FollowTab } from "@/components/mobile-app/follow-tab";
import { OnboardingGate } from "@/components/mobile-app/onboarding-gate";
import { StreamersTab } from "@/components/mobile-app/streamers-tab";
import { SuggestionSheet } from "@/components/mobile-app/suggestion-sheet";
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
  it("keeps ranking order while toggling alerts and supports select all", () => {
    const onChange = vi.fn();
    const onChangeAll = vi.fn();
    render(
      <FollowTab
        streamers={streamers}
        preferences={[
          { channelId: streamers[0]!.channelId, enabled: false, categoryChanged: false, titleChanged: false },
          { channelId: streamers[1]!.channelId, enabled: true, categoryChanged: true, titleChanged: true }
        ]}
        user={null}
        pushActive
        pushBusy={false}
        pushMessage=""
        onConnect={() => undefined}
        onChange={onChange}
        onChangeAll={onChangeAll}
      />
    );

    const names = screen.getAllByText(/스트리머$/).map((element) => element.textContent);
    expect(names).toEqual(["라이브 스트리머", "오프라인 스트리머"]);
    fireEvent.click(screen.getByRole("button", { name: /라이브 스트리머 카테고리 변경 알림/ }));
    expect(onChange).toHaveBeenCalledWith(streamers[0]!.channelId, "categoryChanged", true);
    expect(screen.queryByRole("button", { name: /제목 변경 알림/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /전체 선택/ }));
    expect(onChangeAll).toHaveBeenCalledWith(true);
  });

  it("shows only category and delete actions on alert rows", () => {
    const onRemove = vi.fn();
    render(
      <FollowTab
        streamers={streamers}
        preferences={streamers.map((streamer) => ({
          channelId: streamer.channelId,
          enabled: true,
          categoryChanged: true,
          titleChanged: true
        }))}
        user={null}
        pushActive
        pushBusy={false}
        pushMessage=""
        onConnect={() => undefined}
        onChange={() => undefined}
        onChangeAll={() => undefined}
        onRemove={onRemove}
      />
    );

    expect(screen.getByRole("button", {
      name: /라이브 스트리머 알림 목록에서 삭제/
    })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /제목 변경 알림/ })).not.toBeInTheDocument();
    expect(screen.getAllByText(/스트리머$/).map((element) => element.textContent))
      .toEqual(["라이브 스트리머", "오프라인 스트리머"]);
  });

  it("shows unsupported personal streamers separately and routes them to suggestions", () => {
    const onSuggest = vi.fn();
    render(
      <FollowTab
        streamers={[]}
        preferences={[]}
        user={{ channelId: "c".repeat(32), channelName: "테스터" }}
        pushActive={false}
        pushBusy={false}
        pushMessage=""
        onConnect={() => undefined}
        onChange={() => undefined}
        onChangeAll={() => undefined}
        unsupportedRequests={[{
          id: 1,
          channelId: "d".repeat(32),
          channelName: "아직 미지원",
          channelImageUrl: null,
          requestCount: 1,
          requestedAt: Date.now()
        }]}
        onSuggest={onSuggest}
      />
    );

    expect(screen.getByText("아직 미지원")).toBeInTheDocument();
    expect(screen.getByText("제안 완료 · 현재 미지원")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다른 스트리머 제안하기" }));
    expect(onSuggest).toHaveBeenCalledOnce();
  });

  it("clearly offers login and local-only guest mode", () => {
    const onGuest = vi.fn();
    render(<OnboardingGate user={null} oauthConfigured={true} onGuest={onGuest} />);

    expect(screen.getByRole("button", { name: /팔로우 불러오기/ })).toBeInTheDocument();
    expect(screen.getByText(/이 브라우저에만 저장/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /비로그인으로 시작/ }));
    expect(onGuest).toHaveBeenCalledOnce();
  });

  it("collects only an idea or a streamer name in the suggestion sheet", () => {
    render(<SuggestionSheet initialType="idea" onSubmitted={() => undefined} onClose={() => undefined} />);
    expect(screen.getByRole("textbox", { name: "원하는 점" })).toBeInTheDocument();
    expect(screen.queryByText(/연락처/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "스트리머 추가" }));
    expect(screen.getByRole("textbox", { name: "스트리머 이름" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "원하는 점" })).not.toBeInTheDocument();
  });

  it("opens streamer detail only from an explicit button and provides back", async () => {
    const onSelect = vi.fn();
    vi.spyOn(api, "streamerBroadcasts").mockResolvedValue({ data: [] });
    vi.spyOn(api, "monthlyStreamer").mockResolvedValue({
      data: {
        month: "2026-07",
        timezone: "Asia/Seoul",
        broadcasts: [{
          id: "live-calendar",
          title: "방송 중",
          category: "talk",
          startedAt: Date.parse("2026-07-29T10:00:00+09:00"),
          endedAt: null,
          vodUrl: null,
          thumbnailUrl: null,
          channelImageUrl: null,
          categoryImageUrl: null
        }],
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
          personalChannelIds={streamers.map((streamer) => streamer.channelId)}
          onSelect={onSelect}
          onChange={() => undefined}
          onAddToAlerts={() => undefined}
          onRemoveFromAlerts={() => undefined}
        />
      </QueryClientProvider>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "오프라인 스트리머 상세 보기" }));
    expect(onSelect).toHaveBeenCalledWith(streamers[1]!.channelId);
    expect(await screen.findByText("방송일 1일 · 다시보기 0개")).toBeInTheDocument();
    expect(screen.getByText("talk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /스트리머 목록/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카테고리" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "방제" })).not.toBeInTheDocument();
  });

  it("shows different Android and iPhone installation steps", () => {
    const onClose = vi.fn();
    render(
      <GuideSheet
        initialPlatform="android"
        canPrompt={false}
        installed={false}
        onInstall={async () => false}
        onClose={onClose}
      />
    );
    expect(screen.getByText("삼성 브라우저에서 열기")).toBeInTheDocument();
    expect(screen.getByText(/삼성 인터넷으로 열어야/)).toBeInTheDocument();
    expect(screen.getByAltText("삼성 브라우저에서 열기 실제 기기 화면")).toHaveAttribute(
      "src",
      expect.stringContaining("samsung-5.jpg")
    );
    const nextButton = screen.getByRole("button", { name: "다음 단계" });
    fireEvent.pointerDown(nextButton, { clientX: 300, clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(nextButton, { clientX: 300, clientY: 300, pointerId: 1 });
    fireEvent.click(nextButton);
    expect(screen.getByText("웹 애플리케이션 설치")).toBeInTheDocument();
    expect(screen.getByAltText("웹 애플리케이션 설치 실제 기기 화면")).toHaveAttribute(
      "src",
      expect.stringContaining("samsung-6.jpg")
    );
    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(screen.getByText("경고에서 설치 계속하기")).toBeInTheDocument();
    expect(screen.getByAltText("경고에서 설치 계속하기 실제 기기 화면")).toHaveAttribute(
      "src",
      expect.stringContaining("samsung-7.jpg")
    );
    fireEvent.click(screen.getByRole("button", { name: "iPhone" }));
    expect(screen.getByText("Safari 메뉴에서 공유")).toBeInTheDocument();
    expect(screen.getByAltText("Safari 메뉴에서 공유 실제 기기 화면")).toHaveAttribute(
      "src",
      expect.stringContaining("iphone-1.jpg")
    );
    expect(screen.getByText(/기본 Safari로 열어야/)).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("guide-carousel"), { clientX: 120, clientY: 120 });
    fireEvent.pointerUp(screen.getByTestId("guide-carousel"), { clientX: 20, clientY: 120 });
    expect(screen.getByText("Safari 메뉴에서 공유")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
