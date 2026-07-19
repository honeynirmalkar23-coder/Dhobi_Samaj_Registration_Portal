import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");
const distRoot = join(process.cwd(), "dist");
const serverOnlyPatterns = [
  "better-sqlite3",
  "pdfkit",
  "busboy",
  "file-type",
  "vite/local-portal-backend",
  "DEV_PORTAL_SIGNING_SECRET"
];

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

    return /\.(css|html|js|json|mjs|svg|ts|tsx|txt)$/i.test(path) ? [path] : [];
  });
}

function readFiles(files: string[]): string {
  return files.map((filePath) => readFileSync(filePath, "utf8")).join("\n");
}

describe("local portal backend browser safety", () => {
  it("does not import local server implementation from frontend source", () => {
    const source = readFiles(collectFiles(sourceRoot));

    for (const pattern of serverOnlyPatterns) {
      expect(source).not.toContain(pattern);
    }
  });

  it("keeps local backend implementation out of the current production build", () => {
    const distSource = readFiles(collectFiles(distRoot));

    expect(distSource).not.toContain("better-sqlite3");
    expect(distSource).not.toContain("pdfkit");
    expect(distSource).not.toContain("busboy");
    expect(distSource).not.toContain("file-type");
    expect(distSource).not.toContain("DEV_PORTAL_SIGNING_SECRET");
    expect(distSource).not.toContain(".local-data");
    expect(distSource).not.toContain("/api/local-portal");
  });
});

