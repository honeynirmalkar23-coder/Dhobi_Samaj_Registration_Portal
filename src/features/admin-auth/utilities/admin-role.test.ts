import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isAdministratorUser } from "./admin-role";

function createUser(appMetadata: Record<string, unknown>, userMetadata: Record<string, unknown> = {}) {
  return {
    app_metadata: appMetadata,
    user_metadata: userMetadata
  } as User;
}

describe("isAdministratorUser", () => {
  it("trusts only app_metadata role", () => {
    expect(isAdministratorUser(createUser({ role: "admin" }))).toBe(true);
    expect(isAdministratorUser(createUser({ role: "member" }))).toBe(false);
    expect(isAdministratorUser(createUser({}, { role: "admin" }))).toBe(false);
    expect(isAdministratorUser(null)).toBe(false);
  });
});
