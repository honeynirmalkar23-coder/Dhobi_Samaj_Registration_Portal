import { describe, expect, it } from "vitest";
import { routePaths } from "../../../config/routes.config";
import { getSafeAdminRedirectPath } from "./admin-redirect";

describe("getSafeAdminRedirectPath", () => {
  it.each([
    "/admin/dashboard",
    "/admin/payment-settings",
    "/admin/registrations/DS-2026-000001",
    "/admin/dashboard#registrations"
  ])("accepts safe internal admin redirect %s", (path) => {
    expect(getSafeAdminRedirectPath(path)).toBe(path);
  });

  it.each([
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "/status",
    "/",
    "/admin/login",
    "%2F%2Fexample.com"
  ])("rejects unsafe redirect %s", (path) => {
    expect(getSafeAdminRedirectPath(path)).toBe(routePaths.adminDashboard);
  });
});
