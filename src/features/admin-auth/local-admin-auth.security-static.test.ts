import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");
const adminAuthRoot = join(process.cwd(), "src", "features", "admin-auth");
const distRoot = join(process.cwd(), "dist");
const distFreshnessInputs = [
  join(sourceRoot, "features", "admin-auth", "context", "AdminAuthContext.tsx"),
  join(sourceRoot, "features", "admin-auth", "services", "local-admin-auth.client.ts"),
  join(sourceRoot, "config", "admin-auth-mode.config.ts")
];
const textFilePattern = /\.(css|html|js|json|mjs|svg|ts|tsx|txt)$/i;

function collectFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectFiles(path);
    }

    if (!stats.isFile() || path.includes(".test.") || path.endsWith(".d.ts")) {
      return [];
    }

    if (!textFilePattern.test(path)) {
      return [];
    }

    return [path];
  });
}

function readFiles(files: string[]): string {
  return files.map((filePath) => readFileSync(filePath, "utf8")).join("\n");
}

function hasCurrentDistBuild(): boolean {
  if (!existsSync(distRoot)) {
    return false;
  }

  const latestInputMtime = Math.max(
    ...distFreshnessInputs
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => statSync(filePath).mtimeMs)
  );

  return statSync(distRoot).mtimeMs >= latestInputMtime;
}

describe("local development admin auth static security", () => {
  it("does not expose forbidden administrator secret variable names in browser source", () => {
    const source = readFiles(collectFiles(sourceRoot));

    expect(source).not.toContain("VITE_ADMIN_PASSWORD");
    expect(source).not.toContain("VITE_ADMIN_PASSWORD_HASH");
    expect(source).not.toContain("VITE_ADMIN_SESSION_SECRET");
    expect(source).not.toContain("DEV_ADMIN_PASSWORD_HASH");
    expect(source).not.toContain("DEV_ADMIN_SESSION_SECRET");
  });

  it("keeps server-only local auth modules out of browser source", () => {
    const source = readFiles(collectFiles(sourceRoot));

    expect(source).not.toContain("vite/local-admin-auth");
    expect(source).not.toContain("local-admin-auth.config");
    expect(source).not.toContain("local-admin-auth.server");
    expect(source).not.toContain("local-admin-session");
    expect(source).not.toContain("bcryptjs");
  });

  it("does not store administrator authentication in browser storage", () => {
    const source = readFiles(collectFiles(adminAuthRoot));

    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
  });

  it("keeps local development secret names out of current built output when dist exists", () => {
    if (!hasCurrentDistBuild()) {
      return;
    }

    const distSource = readFiles(collectFiles(distRoot));

    expect(distSource).not.toContain("VITE_ADMIN_PASSWORD");
    expect(distSource).not.toContain("VITE_ADMIN_PASSWORD_HASH");
    expect(distSource).not.toContain("VITE_ADMIN_SESSION_SECRET");
    expect(distSource).not.toContain("DEV_ADMIN_PASSWORD_HASH");
    expect(distSource).not.toContain("DEV_ADMIN_SESSION_SECRET");
    expect(distSource).not.toContain("/api/dev-admin-auth/login");
  });
});
