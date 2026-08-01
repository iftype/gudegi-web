import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuideSheet } from "@/components/mobile-app/guide-sheet";
import { FollowTab } from "@/components/mobile-app/follow-tab";
import { createPushNotice } from "@/components/mobile-app/mobile-app";
import { OnboardingGate } from "@/components/mobile-app/onboarding-gate";
import { SettingsTab } from "@/components/mobile-app/settings-tab";
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
    trackingRank: 1,
    activeBroadcastStartedAt: Date.now() - 90 * 60_000
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
const allCategoryFilter = { allCategories: true as const, categoryKeys: [] as string[] };

describe("mobile-first entry and guidance", () => {
  it("uses a toast for push success and a modal for actionable failures", () => {
    expect(createPushNotice("연결됐습니다. 테스트 알림을 확인해 주세요.")).toEqual({
      kind: "toast",
      message: "연결됐습니다. 테스트 알림을 확인해 주세요.",
      title: "완료",
      showGuide: false
    });
    expect(createPushNotice("알림 권한이 꺼져 있습니다. 휴대폰 설정에서 허용해 주세요.")).toEqual({
      kind: "dialog",
      message: "알림 권한이 꺼져 있습니다. 휴대폰 설정에서 허용해 주세요.",
      title: "알림 권한을 확인해 주세요",
      showGuide: false
    });
  });

  it("keeps ranking order while toggling alerts and supports select all", () => {
    const onChange = vi.fn();
    const onChangeAll = vi.fn();
    const onClearAll = vi.fn();
    render(
      <FollowTab
        streamers={streamers}
        preferences={[
          { channelId: streamers[0]!.channelId, enabled: false, liveStarted: false, categoryChanged: false, titleChanged: false, keywords: [], categoryFilter: allCategoryFilter },
          { channelId: streamers[1]!.channelId, enabled: true, liveStarted: true, categoryChanged: true, titleChanged: true, keywords: [], categoryFilter: allCategoryFilter }
        ]}
        user={null}
        pushActive
        pushBusy={false}
        onConnect={() => undefined}
        onChange={onChange}
        onChangeAll={onChangeAll}
        onClearAll={onClearAll}
      />
    );

    const names = screen.getAllByText(/스트리머$/).map((element) => element.textContent);
    expect(names).toEqual(["라이브 스트리머", "오프라인 스트리머"]);
    const followHeader = screen.getByRole("heading", { name: "알림 관리" }).closest("header");
    expect(followHeader).toContainElement(
      screen.getByRole("button", { name: "기기 알림 연결됨" })
    );
    fireEvent.click(screen.getByRole("button", { name: "라이브 스트리머 알림 받기" }));
    expect(onChange).toHaveBeenCalledWith(streamers[0]!.channelId, "enabled", true);
    expect(screen.queryByRole("button", { name: /제목 변경 알림/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /전체 선택/ }));
    expect(onChangeAll).toHaveBeenCalledWith(true);
    const importButton = screen.getByRole("button", { name: "팔로우 불러오기" });
    const clearButton = screen.getByRole("button", { name: "알림 목록 전체삭제" });
    expect(importButton.parentElement).toBe(clearButton.parentElement);
    fireEvent.click(clearButton);
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it("shows alert, category, tag, and delete actions on alert rows", () => {
    const onRemove = vi.fn();
    const onOpenDetail = vi.fn();
    const onChange = vi.fn();
    const onRulesChange = vi.fn();
    render(
      <FollowTab
        streamers={streamers}
        preferences={streamers.map((streamer) => ({
          channelId: streamer.channelId,
          enabled: true,
          liveStarted: true,
          categoryChanged: true,
          titleChanged: true,
          keywords: [],
          categoryFilter: allCategoryFilter
        }))}
        user={null}
        pushActive
        pushBusy={false}
        onConnect={() => undefined}
        onChange={onChange}
        onChangeAll={() => undefined}
        onRulesChange={onRulesChange}
        onRemove={onRemove}
        onOpenDetail={onOpenDetail}
      />
    );

    expect(screen.getByRole("button", { name: "라이브 스트리머 알림 받기" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "라이브 스트리머 카테고리 선택" }))
      .toBeInTheDocument();
    const alertButton = screen.getByRole("button", { name: "라이브 스트리머 알림 받기" });
    const ruleButton = screen.getByRole("button", { name: "라이브 스트리머 알림 조건" });
    const categoryButton = screen.getByRole("button", { name: "라이브 스트리머 카테고리 선택" });
    const moreButton = screen.getByRole("button", { name: "라이브 스트리머 더보기" });
    expect(screen.queryByRole("button", {
      name: "라이브 스트리머 알림 목록에서 삭제"
    })).not.toBeInTheDocument();
    fireEvent.click(moreButton);
    const deleteButton = screen.getByRole("button", {
      name: "라이브 스트리머 알림 목록에서 삭제"
    });
    fireEvent.click(deleteButton);
    expect(onRemove).toHaveBeenCalledWith(streamers[0]!.channelId);
    expect(alertButton.parentElement?.parentElement).toContainElement(
      screen.getByText("라이브 스트리머")
    );
    expect(categoryButton.parentElement).toContainElement(
      screen.getByLabelText("라이브 스트리머 선택 카테고리")
    );
    expect(alertButton).toHaveAttribute("aria-pressed", "true");
    expect(alertButton.parentElement).toContainElement(ruleButton);
    expect(alertButton.querySelector(".lucide-bell-ring")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "라이브 스트리머 방송 보기" }))
      .toHaveAttribute("href", `/open/chzzk/${streamers[0]!.channelId}`);
    fireEvent.click(screen.getByRole("button", { name: "라이브 스트리머" }));
    expect(onOpenDetail).toHaveBeenCalledWith(streamers[0]!.channelId);
    expect(screen.getByText("1시간 30분")).toBeInTheDocument();
    expect(screen.queryByText(/팔로워 순위/)).not.toBeInTheDocument();
    expect(screen.getAllByText("전체 카테고리")).toHaveLength(2);
    fireEvent.click(ruleButton);
    expect(screen.getByRole("dialog", { name: "라이브 스트리머 알림 조건" }))
      .toBeInTheDocument();
    const titleAlert = screen.getByRole("button", {
      name: "라이브 스트리머 방제 변경 알림"
    });
    fireEvent.click(titleAlert);
    fireEvent.change(screen.getByLabelText("라이브 스트리머 키워드"), {
      target: { value: "합방" }
    });
    fireEvent.click(screen.getByRole("button", { name: "라이브 스트리머 키워드 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "알림 조건 적용" }));
    expect(onRulesChange).toHaveBeenCalledWith(streamers[0]!.channelId, {
      liveStarted: true,
      categoryChanged: true,
      titleChanged: false,
      keywords: ["합방"]
    });
    expect(screen.getAllByText(/스트리머$/).map((element) => element.textContent))
      .toEqual(["라이브 스트리머", "오프라인 스트리머"]);
  });

  it("defaults to all categories and applies a selected CHZZK category", () => {
    const onCategoryFilterChange = vi.fn();
    const onCategoryFilterChangeAll = vi.fn();
    render(
      <FollowTab
        streamers={[streamers[0]!]}
        preferences={[{
          channelId: streamers[0]!.channelId,
          enabled: true,
          liveStarted: true,
          categoryChanged: true,
          titleChanged: false,
          keywords: [],
          categoryFilter: allCategoryFilter
        }]}
        user={null}
        pushActive
        pushBusy={false}
        categories={[
          {
            categoryKey: "ETC:talk",
            categoryType: "ETC",
            categoryId: "talk",
            categoryValue: "talk",
            posterImageUrl: null,
            openLiveCount: 200,
            concurrentUserCount: 20_000,
            syncedAt: 1
          },
          {
            categoryKey: "GAME:League_of_Legends",
            categoryType: "GAME",
            categoryId: "League_of_Legends",
            categoryValue: "리그 오브 레전드",
            posterImageUrl: null,
            openLiveCount: 100,
            concurrentUserCount: 10_000,
            syncedAt: 1
          }
        ]}
        onConnect={() => undefined}
        onChange={() => undefined}
        onChangeAll={() => undefined}
        onCategoryFilterChange={onCategoryFilterChange}
        onCategoryFilterChangeAll={onCategoryFilterChangeAll}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "라이브 스트리머 카테고리 선택" }));
    const categoryDialog = screen.getByRole("dialog", { name: "카테고리 태그 선택" });
    expect(categoryDialog.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByRole("button", { name: "전체 체크 모든 방송 카테고리 알림" }))
      .toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /저챗.*기타/ }));
    fireEvent.click(screen.getByRole("button", { name: "카테고리 선택" }));
    expect(onCategoryFilterChange).toHaveBeenCalledWith(
      streamers[0]!.channelId,
      {
        allCategories: false,
        categoryKeys: ["ETC:talk"]
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "전체 카테고리 필터" }));
    expect(screen.getByRole("dialog", { name: "전체 카테고리 필터" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /리그 오브 레전드.*게임/ }));
    fireEvent.click(screen.getByRole("button", { name: "전체에 카테고리 적용" }));
    expect(onCategoryFilterChangeAll).toHaveBeenCalledWith({
      allCategories: false,
      categoryKeys: ["GAME:League_of_Legends"]
    });
  });

  it("shows unsupported personal streamers separately and routes them to suggestions", () => {
    const onSuggest = vi.fn();
    const onSuggestUnsupported = vi.fn().mockResolvedValue(undefined);
    render(
      <FollowTab
        streamers={[]}
        preferences={[]}
        user={{ channelId: "c".repeat(32) }}
        pushActive={false}
        pushBusy={false}
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
        onSuggestUnsupported={onSuggestUnsupported}
      />
    );

    expect(screen.getByText("아직 미지원")).toBeInTheDocument();
    expect(screen.getByText("현재 수집하지 않아 미지원")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "수집 제안" }));
    expect(onSuggestUnsupported).toHaveBeenCalledWith("아직 미지원");
    fireEvent.click(screen.getByRole("button", { name: "다른 스트리머 제안하기" }));
    expect(onSuggest).toHaveBeenCalledOnce();
  });

  it("clearly offers login and local-only guest mode", () => {
    const onGuest = vi.fn();
    render(<OnboardingGate user={null} oauthConfigured={true} onGuest={onGuest} />);

    expect(screen.getByRole("button", { name: /치지직 로그인/ })).toBeInTheDocument();
    expect(screen.getByText(/이 브라우저에만 저장/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /비로그인으로 시작/ }));
    expect(onGuest).toHaveBeenCalledOnce();
  });

  it("collects only an idea or a streamer name in the suggestion sheet", () => {
    render(<SuggestionSheet initialType="idea" onSubmitted={() => undefined} onClose={() => undefined} />);
    expect(screen.getByRole("textbox", { name: "원하는 점" })).toBeInTheDocument();
    expect(screen.queryByText(/연락처/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "스트리머 추가" }));
    expect(screen.getByRole("textbox", { name: "스트리머 이름" })).toHaveAttribute(
      "placeholder",
      "추가할 스트리머를 편하게 써주세요"
    );
    expect(screen.queryByRole("textbox", { name: "원하는 점" })).not.toBeInTheDocument();
  });

  it("routes settings feedback through the in-app suggestion action", () => {
    const onFeedback = vi.fn();
    render(
      <SettingsTab
        user={null}
        installed={false}
        pushActive={false}
        pushBusy={false}
        permission="default"
        targetCount={0}
        logs={[]}
        logoutBusy={false}
        logoutMessage=""
        onEnable={() => undefined}
        onDisable={() => undefined}
        onTest={() => undefined}
        onGuide={() => undefined}
        onFeedback={onFeedback}
        onLogout={() => undefined}
        onClearLogs={() => undefined}
        onResetAlerts={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "피드백 보내기" }));
    expect(onFeedback).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link", { name: "피드백 보내기" })).not.toBeInTheDocument();
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
          categoryImageUrl: null,
          categoryTimeline: [{
            category: "리그 오브 레전드",
            detectedAt: Date.parse("2026-07-29T10:00:00+09:00"),
            categoryImageUrl: "https://example.test/lol.png"
          }, {
            category: "talk",
            detectedAt: Date.parse("2026-07-29T12:30:00+09:00"),
            categoryImageUrl: "https://example.test/talk.png"
          }]
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
          personalChannelIds={streamers.map((streamer) => streamer.channelId)}
          onSelect={onSelect}
          onAddToAlerts={() => undefined}
          onRemoveFromAlerts={() => undefined}
        />
      </QueryClientProvider>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "라이브 스트리머 방송 보기" }))
      .toHaveAttribute("href", `/open/chzzk/${streamers[0]!.channelId}`);
    const streamerSearch = screen.getByPlaceholderText("스트리머 검색 후 알림 추가");
    fireEvent.change(streamerSearch, { target: { value: "오프라인" } });
    expect(screen.queryByText("라이브 스트리머")).not.toBeInTheDocument();
    expect(screen.getByText("오프라인 스트리머")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "오프라인 스트리머 상세 보기" }));
    expect(onSelect).toHaveBeenCalledWith(streamers[1]!.channelId);
    expect(await screen.findByText("방송일 1일 · 다시보기 0개")).toBeInTheDocument();
    expect(screen.getAllByText("talk").length).toBeGreaterThan(0);
    expect(screen.getByRole("combobox", { name: "다시보기 필터" })).toBeInTheDocument();
    expect(screen.getByText("달력에서 방송한 날짜를 선택해 주세요.")).toBeInTheDocument();
    const visibleMonth = new Date();
    const visibleDate = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-29`;
    fireEvent.click(screen.getByRole("button", { name: `${visibleDate} 방송 기록 보기` }));
    expect(screen.getByText("방송 중")).toBeInTheDocument();
    expect(screen.getAllByText("리그 오브 레전드").length).toBeGreaterThan(0);
    expect(screen.getByText(`${new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit"
    }).format(Date.parse("2026-07-29T12:30:00+09:00"))} 전환`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /스트리머 목록/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "알림 받기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "카테고리" })).not.toBeInTheDocument();
  });

  it("shows the detected platform guide without platform navigation or redundant notice", () => {
    const onClose = vi.fn();
    const onEnable = vi.fn();
    render(
      <GuideSheet
        initialPlatform="android"
        canPrompt={false}
        installed={false}
        onInstall={async () => false}
        onEnable={onEnable}
        onClose={onClose}
      />
    );
    expect(screen.getByText("삼성 브라우저에서 열기")).toBeInTheDocument();
    expect(screen.getByText(/삼성 브라우저에서 열기.*선택하세요/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "iPhone" })).not.toBeInTheDocument();
    expect(screen.queryByText(/화살표를 직접 눌러/)).not.toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "설치 후 구데기 앱에서 알림 받기" })).toBeInTheDocument();
    expect(screen.getByAltText("경고에서 설치 계속하기 실제 기기 화면")).toHaveAttribute(
      "src",
      expect.stringContaining("samsung-7.jpg")
    );

    cleanup();
    render(
      <GuideSheet
        initialPlatform="ios"
        canPrompt={false}
        installed={false}
        onInstall={async () => false}
        onEnable={onEnable}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Safari 메뉴에서 공유")).toBeInTheDocument();
    expect(screen.getByAltText("Safari 메뉴에서 공유 실제 기기 화면")).toHaveAttribute(
      "src",
      expect.stringContaining("iphone-1.jpg")
    );
    expect(screen.queryByText(/기본 Safari로 열어야 설치할 수 있어요/)).not.toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("guide-carousel"), { clientX: 120, clientY: 120 });
    fireEvent.pointerUp(screen.getByTestId("guide-carousel"), { clientX: 20, clientY: 120 });
    expect(screen.getByText("Safari 메뉴에서 공유")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
