import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");

function collectProductionSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectProductionSourceFiles(path);
    }

    if (
      !stats.isFile() ||
      path.includes(".test.") ||
      path.endsWith(".d.ts")
    ) {
      return [];
    }

    return [path];
  });
}

function readProductionSource(): string {
  return collectProductionSourceFiles(sourceRoot)
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

describe("Phase 06 frontend security assertions", () => {
  it("does not expose privileged Supabase or fake-admin patterns in production source", () => {
    const source = readProductionSource();

    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service_role");
    expect(source).not.toContain("signUp(");
    expect(source).not.toContain("from(\"registrations\")");
    expect(source).not.toContain("from('registrations')");
    expect(source).not.toMatch(/password\s*:\s*["'][^"']+["']/i);
    expect(source).not.toMatch(/admin[A-Z0-9._%+-]*@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  });
});
