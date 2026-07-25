import { describe, expect, it } from "vitest";
import { formatElapsed } from "../lib/format";

describe("formatElapsed", () => {
  it("formats short and long broadcast offsets", () => {
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatElapsed(3_665_000)).toBe("1:01:05");
  });

  it("does not expose negative offsets", () => {
    expect(formatElapsed(-1_000)).toBe("0:00");
  });
});
