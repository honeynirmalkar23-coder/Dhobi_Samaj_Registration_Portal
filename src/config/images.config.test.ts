import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { communityImages } from "./images.config";

describe("community image configuration", () => {
  it("points all configured community images to existing files", () => {
    const imagePaths = Object.values(communityImages);

    expect(imagePaths).toHaveLength(10);
    imagePaths.forEach((imagePath) => {
      expect(existsSync(join(process.cwd(), "public", imagePath))).toBe(true);
    });
  });
});
