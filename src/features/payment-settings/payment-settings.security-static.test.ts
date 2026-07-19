import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src", "features", "payment-settings");

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

function readPaymentSettingsProductionSource(): string {
  return collectProductionSourceFiles(sourceRoot)
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

describe("Phase 07 payment-settings security assertions", () => {
  it("does not persist, upload, or call unknown backend resources in production code", () => {
    const source = readPaymentSettingsProductionSource();

    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain(".from(");
    expect(source).not.toContain(".upload(");
    expect(source).not.toContain("storage.from");
    expect(source).not.toContain("dhobi.society@upi");
    expect(source).not.toContain("fake_success");
    expect(source).not.toContain("Payment successful");
  });
});
