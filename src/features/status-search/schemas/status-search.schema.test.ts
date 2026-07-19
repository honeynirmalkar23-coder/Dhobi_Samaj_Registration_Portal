import { describe, expect, it } from "vitest";
import { statusSearchSchema } from "./status-search.schema";

describe("statusSearchSchema", () => {
  it("rejects an empty registration ID", () => {
    const result = statusSearchSchema.safeParse({
      registrationId: "   "
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("कृपया पंजीकरण आईडी दर्ज करें।");
  });

  it.each(["DS2026000001", "DS-26-000001", "ABC-2026-000001", "DS-2026-1"])(
    "rejects malformed registration ID %s",
    (registrationId) => {
      const result = statusSearchSchema.safeParse({
        registrationId
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "कृपया DS-YYYY-000001 प्रारूप में मान्य पंजीकरण आईडी दर्ज करें।"
      );
    }
  );

  it("returns a normalized valid registration ID", () => {
    const result = statusSearchSchema.safeParse({
      registrationId: "  ds-2026-000001  "
    });

    expect(result.success).toBe(true);
    expect(result.data?.registrationId).toBe("DS-2026-000001");
  });
});
