import { describe, expect, it } from "vitest";
import { formatDuration, formatElapsed, resolveTimelineOrigin } from "../lib/format";

describe("formatElapsed", () => {
  it("formats short and long broadcast offsets", () => {
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatElapsed(3_665_000)).toBe("1:01:05");
  });

  it("does not expose negative offsets", () => {
    expect(formatElapsed(-1_000)).toBe("0:00");
  });
});

describe("timeline origin", () => {
  it("falls back to the first collected bucket when the API start is later", () => {
    expect(resolveTimelineOrigin(20_000, 10_000)).toBe(10_000);
    expect(resolveTimelineOrigin(10_000, 20_000)).toBe(10_000);
  });

  it("does not display a negative duration", () => {
    expect(formatDuration(Date.now() + 60_000, null)).toBe("0분");
  });
});
