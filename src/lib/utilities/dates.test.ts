import { describe, expect, it } from "vitest";
import { formatPublicDate } from "./dates";

describe("formatPublicDate", () => {
  it("formats a valid ISO date in Hindi for India", () => {
    expect(formatPublicDate("2026-07-15T00:00:00.000Z")).toBe("15 जुलाई 2026");
  });

  it("can include an India-time display", () => {
    expect(
      formatPublicDate("2026-07-15T17:00:00.000Z", {
        includeTime: true
      })
    ).toContain("15 जुलाई 2026");
  });

  it("returns a safe fallback for invalid or missing dates", () => {
    expect(formatPublicDate("not-a-date")).toBe("उपलब्ध नहीं");
    expect(formatPublicDate(null)).toBe("उपलब्ध नहीं");
    expect(formatPublicDate(undefined)).toBe("उपलब्ध नहीं");
  });
});
