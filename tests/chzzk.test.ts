import { describe, expect, it } from "vitest";
import { getChzzkLiveUrl, isChzzkChannelId } from "../lib/chzzk";

describe("CHZZK live links", () => {
  it("builds a live URL only for a valid channel id", () => {
    const channelId = "e9c11510c1c6097a20b92ebcb289b26a";
    expect(isChzzkChannelId(channelId)).toBe(true);
    expect(getChzzkLiveUrl(channelId))
      .toBe(`https://chzzk.naver.com/live/${channelId}`);
  });

  it("rejects values that could escape into another URL", () => {
    expect(getChzzkLiveUrl("../admin")).toBeNull();
    expect(getChzzkLiveUrl("https://example.com")).toBeNull();
  });
});
