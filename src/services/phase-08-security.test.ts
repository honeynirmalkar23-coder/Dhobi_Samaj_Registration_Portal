import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AdminRegistrationListItem } from "../features/admin-dashboard/types/admin-dashboard.types";
import { buildRegistrationsCsv } from "./admin-dashboard.service";
import {
  getPaymentAccessToken,
  getPaymentAccessTokenStorageKey,
  removePaymentAccessToken,
  storePaymentAccessToken
} from "./payment.service";

const sourceRoot = join(process.cwd(), "src");
const migrationsRoot = join(process.cwd(), "supabase", "migrations");

function collectProductionSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectProductionSourceFiles(path);
    }

    if (!stats.isFile() || path.includes(".test.") || path.endsWith(".d.ts")) {
      return [];
    }

    return [path];
  });
}

function readMigration(name: string): string {
  return readFileSync(join(migrationsRoot, name), "utf8");
}

const formulaLikeRow: AdminRegistrationListItem = {
  age: 35,
  createdAt: "2026-07-16T00:00:00.000Z",
  educationLevel: "graduate",
  fullName: "=IMPORTXML(\"https://example.invalid\")",
  paymentStatus: "pending_verification",
  registrationId: "DS-2026-000001",
  registrationStatus: "under_review",
  submittedAt: null,
  totalFamilyMembers: 4,
  updatedAt: "2026-07-16T00:00:00.000Z"
};

describe("Phase 08 security guardrails", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("stores the opaque payment access token only under the registration-scoped session key", () => {
    storePaymentAccessToken("DS-2026-000001", "opaque-token");

    expect(getPaymentAccessTokenStorageKey("DS-2026-000001")).toBe(
      "dhobi-payment-access:DS-2026-000001"
    );
    expect(getPaymentAccessToken("DS-2026-000001")).toBe("opaque-token");
    expect(sessionStorage).toHaveLength(1);

    removePaymentAccessToken("DS-2026-000001");

    expect(getPaymentAccessToken("DS-2026-000001")).toBeNull();
  });

  it("escapes spreadsheet formula prefixes in admin CSV export values", () => {
    const csv = buildRegistrationsCsv([formulaLikeRow]);

    expect(csv).toContain("\"'=IMPORTXML(\"\"https://example.invalid\"\")\"");
    expect(csv).not.toContain("\",=IMPORTXML");
  });

  it("keeps privileged Supabase secrets out of browser production source", () => {
    const source = collectProductionSourceFiles(sourceRoot)
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");

    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service_role");
  });

  it("declares RLS and private storage buckets in Supabase migrations", () => {
    const rlsMigration = readMigration("007_enable_rls_and_policies.sql");
    const storageMigration = readMigration("008_create_storage_buckets_and_policies.sql");

    expect(rlsMigration).toContain("enable row level security");
    expect(storageMigration).toMatch(/\('applicant-photos',\s*'applicant-photos',\s*false/);
    expect(storageMigration).toMatch(/\('payment-proofs',\s*'payment-proofs',\s*false/);
    expect(storageMigration).toMatch(/\('payment-qr-codes',\s*'payment-qr-codes',\s*false/);
  });
});
