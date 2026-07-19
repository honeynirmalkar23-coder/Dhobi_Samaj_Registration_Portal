#!/usr/bin/env node

import { rm } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";

const projectRoot = process.cwd();
const requestedDirectory = process.env.DEV_PORTAL_DATA_DIRECTORY || ".local-data";
const dataDirectory = path.resolve(projectRoot, requestedDirectory);
const confirmed = process.argv.includes("--yes");

function isInsideProjectRoot(target) {
  return target === projectRoot || target.startsWith(`${projectRoot}${path.sep}`);
}

function isDangerousTarget(target) {
  const relative = path.relative(projectRoot, target);

  return (
    !relative ||
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative === "docs" ||
    relative === "public" ||
    relative === "src" ||
    relative === "supabase" ||
    relative.startsWith(`docs${path.sep}`) ||
    relative.startsWith(`public${path.sep}`) ||
    relative.startsWith(`src${path.sep}`) ||
    relative.endsWith(".env.local")
  );
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset local portal data while NODE_ENV=production.");
  process.exit(1);
}

if (!isInsideProjectRoot(dataDirectory) || isDangerousTarget(dataDirectory)) {
  console.error("Refusing to delete an unsafe local data directory.");
  process.exit(1);
}

if (!confirmed) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr
  });
  const answer = await rl.question(`Delete local portal data at ${dataDirectory}? Type "yes" to continue: `);
  rl.close();

  if (answer.trim() !== "yes") {
    console.error("Reset cancelled.");
    process.exit(1);
  }
}

await rm(dataDirectory, {
  force: true,
  recursive: true
});
console.log("Local portal data reset complete.");
