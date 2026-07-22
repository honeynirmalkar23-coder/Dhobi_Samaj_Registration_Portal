import { describe, expect, it } from "vitest";
import type { AdminRegistrationExportRow } from "../../../services/admin-database.types";
import {
  buildRegistrationCsv,
  createRegistrationsCsvFilename,
  registrationExportCsvHeader
} from "./registration-export-csv";

function createExportRow(overrides: Partial<AdminRegistrationExportRow> = {}): AdminRegistrationExportRow {
  return {
    address: "Ward 1, Test Village",
    age: 34,
    boys: 1,
    createdAt: "2026-07-20T00:00:00.000Z",
    dob: null,
    education: "Graduate",
    elderly: 1,
    fullName: "Export User",
    girls: 2,
    mobileNumber: "9876543210",
    paymentAmount: 501,
    paymentReference: null,
    paymentStatus: "pending_verification",
    paymentUtr: null,
    registrationId: "DS-2026-000001",
    updatedAt: "2026-07-20T00:10:00.000Z",
    ...overrides
  };
}

describe("registration export CSV", () => {
  it("builds a header-only CSV for an empty database", () => {
    expect(buildRegistrationCsv([])).toBe(registrationExportCsvHeader.map((header) => `"${header}"`).join(","));
  });

  it("uses date-only filenames for empty exports and date-time filenames for populated exports", () => {
    const now = new Date(2026, 6, 20, 0, 35);

    expect(createRegistrationsCsvFilename(now, 0)).toBe("registrations_2026-07-20.csv");
    expect(createRegistrationsCsvFilename(now, 1)).toBe("registrations_2026-07-20_00-35.csv");
  });

  it("exports requested registration columns in order", () => {
    const csv = buildRegistrationCsv([
      createExportRow({
        paymentReference: "REF-1",
        paymentUtr: "UTR-1"
      })
    ]);

    expect(csv.split("\r\n")[1]).toBe(
      [
        "DS-2026-000001",
        "Export User",
        "9876543210",
        "",
        34,
        "Graduate",
        "Ward 1, Test Village",
        1,
        2,
        1,
        "pending_verification",
        "REF-1",
        "UTR-1",
        "501.00",
        "2026-07-20T00:00:00.000Z",
        "2026-07-20T00:10:00.000Z"
      ].map((value) => `"${value}"`).join(",")
    );
  });

  it("escapes quotes, commas, and formula-like text safely", () => {
    const csv = buildRegistrationCsv([
      createExportRow({
        address: "Near market, block \"A\"",
        fullName: "=HYPERLINK(\"bad\")",
        paymentAmount: null
      })
    ]);

    expect(csv).toContain("\"'=HYPERLINK(\"\"bad\"\")\"");
    expect(csv).toContain("\"Near market, block \"\"A\"\"\"");
    expect(csv.endsWith("\"2026-07-20T00:10:00.000Z\"")).toBe(true);
  });
});
