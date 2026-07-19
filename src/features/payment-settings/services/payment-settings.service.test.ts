import { describe, expect, it } from "vitest";
import {
  loadAdminPaymentSettings,
  saveAdminPaymentSettings
} from "./payment-settings.service";

describe("payment settings feature service exports", () => {
  it("re-exports the Phase 08 admin payment-settings service functions", () => {
    expect(typeof loadAdminPaymentSettings).toBe("function");
    expect(typeof saveAdminPaymentSettings).toBe("function");
  });
});
