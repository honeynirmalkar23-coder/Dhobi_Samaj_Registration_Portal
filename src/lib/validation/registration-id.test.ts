import { describe, expect, it } from "vitest";
import {
  isValidRegistrationId,
  normalizeRegistrationId
} from "./registration-id";

describe("registration ID validation", () => {
  it("normalizes whitespace and case", () => {
    expect(normalizeRegistrationId("  ds-2026-000001  ")).toBe("DS-2026-000001");
  });

  it("accepts a valid registration ID", () => {
    expect(isValidRegistrationId("DS-2026-000001")).toBe(true);
  });

  it.each([
    "DS2026000001",
    "DS-26-000001",
    "ABC-2026-000001",
    "DS-2026-1"
  ])("rejects invalid registration ID %s", (registrationId) => {
    expect(isValidRegistrationId(registrationId)).toBe(false);
  });
});
