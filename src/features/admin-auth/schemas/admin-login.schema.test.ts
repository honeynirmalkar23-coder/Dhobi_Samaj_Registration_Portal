import { describe, expect, it } from "vitest";
import { adminLoginSchema } from "./admin-login.schema";

describe("adminLoginSchema", () => {
  it("requires an email address", () => {
    const result = adminLoginSchema.safeParse({
      email: "",
      password: "password"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("कृपया ईमेल पता दर्ज करें।");
  });

  it("rejects invalid email addresses", () => {
    const result = adminLoginSchema.safeParse({
      email: "not-email",
      password: "password"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("कृपया मान्य ईमेल पता दर्ज करें।");
  });

  it("requires a password without trimming its value", () => {
    const result = adminLoginSchema.safeParse({
      email: "admin@example.test",
      password: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("कृपया पासवर्ड दर्ज करें।");
  });

  it("normalizes a valid email while preserving password spaces", () => {
    const result = adminLoginSchema.safeParse({
      email: "  ADMIN@EXAMPLE.TEST  ",
      password: " pass word "
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "admin@example.test",
      password: " pass word "
    });
  });
});
