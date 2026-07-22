import type { AdminRegistrationExportRow } from "../../../services/admin-database.types";

export const registrationExportCsvHeader = [
  "Registration ID",
  "Full Name",
  "Mobile Number",
  "DOB",
  "Age",
  "Education",
  "Address",
  "Boys",
  "Girls",
  "Elderly",
  "Payment Status",
  "Payment Reference",
  "Payment UTR",
  "Payment Amount",
  "Created At",
  "Updated At"
] as const;

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const stringValue = String(value ?? "");
  const formulaSafeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;

  return `"${formulaSafeValue.replace(/"/g, '""')}"`;
}

function formatPaymentAmount(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) {
    return "";
  }

  return amount.toFixed(2);
}

function rowToCsvCells(row: AdminRegistrationExportRow): Array<string | number | null> {
  return [
    row.registrationId,
    row.fullName,
    row.mobileNumber,
    row.dob,
    row.age,
    row.education,
    row.address,
    row.boys,
    row.girls,
    row.elderly,
    row.paymentStatus,
    row.paymentReference,
    row.paymentUtr,
    formatPaymentAmount(row.paymentAmount),
    row.createdAt,
    row.updatedAt
  ];
}

export function createRegistrationsCsvFilename(now = new Date(), rowCount = 1): string {
  const date = [
    now.getFullYear(),
    padDatePart(now.getMonth() + 1),
    padDatePart(now.getDate())
  ].join("-");

  if (rowCount === 0) {
    return `registrations_${date}.csv`;
  }

  return `registrations_${date}_${padDatePart(now.getHours())}-${padDatePart(now.getMinutes())}.csv`;
}

export function buildRegistrationCsvChunks(rows: AdminRegistrationExportRow[]): string[] {
  const chunks = [registrationExportCsvHeader.map(escapeCsvCell).join(",")];

  for (const row of rows) {
    chunks.push("\r\n", rowToCsvCells(row).map(escapeCsvCell).join(","));
  }

  return chunks;
}

export function buildRegistrationCsv(rows: AdminRegistrationExportRow[]): string {
  return buildRegistrationCsvChunks(rows).join("");
}

export function downloadRegistrationCsv(rows: AdminRegistrationExportRow[], filename: string): void {
  const blob = new Blob(["\uFEFF", ...buildRegistrationCsvChunks(rows)], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
