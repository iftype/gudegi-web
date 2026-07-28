import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VodCalendarExperience } from "@/components/vod-calendar-experience";
import { api } from "@/lib/api";
import type { CalendarBroadcast, Streamer } from "@/lib/types";

const streamer: Streamer = {
  channelId: "e9c11510c1c6097a20b92ebcb289b26a",
  channelName: "테스트 스트리머",
  channelImageUrl: null,
  enabled: true,
  isLive: false,
  activeBroadcastId: null,
  collectorState: "idle",
  lastCheckedAt: null
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("VodCalendarExperience", () => {
  it("shows three calendar partitions as two VODs plus a more button and opens the full day list", async () => {
    const broadcasts: CalendarBroadcast[] = Array.from({ length: 4 }, (_, index) => ({
      id: `broadcast-${index}`,
      title: `방송 ${index + 1}`,
      category: "게임",
      startedAt: Date.parse(`2026-07-15T${String(10 + index).padStart(2, "0")}:00:00+09:00`),
      endedAt: Date.parse(`2026-07-15T${String(11 + index).padStart(2, "0")}:00:00+09:00`),
      vodUrl: `https://chzzk.naver.com/video/${index}`,
      thumbnailUrl: null,
      channelImageUrl: null
    }));
    vi.spyOn(api, "monthlyStreamer").mockResolvedValue({
      data: {
        month: "2026-07",
        timezone: "Asia/Seoul",
        broadcasts,
        categoryDurations: [{ category: "게임", durationMs: 14_400_000, percentage: 100 }],
        totalDurationMs: 14_400_000,
        dayStatuses: [
          { date: "2026-07-14", status: "no_broadcast" },
          { date: "2026-07-15", status: "broadcast" },
          { date: "2026-07-16", status: "uncollected" }
        ]
      }
    });
    vi.spyOn(api, "pushConfig").mockResolvedValue({
      data: { enabled: false, publicKey: "" }
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <VodCalendarExperience streamers={[streamer]} />
      </QueryClientProvider>
    );

    const more = await screen.findByRole("button", { name: "4개 방송 모두 보기" });
    fireEvent.click(more);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("link")).toHaveLength(4);
    expect(within(dialog).getByText("이날의 방송 4개")).toBeInTheDocument();
  });
});
