import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import bcrypt from "bcryptjs";

const testPassword = "local-e2e-password";
const dataDirectory = ".local-data-e2e";

await rm(dataDirectory, {
  force: true,
  recursive: true
});

const env = {
  ...process.env,
  DEV_ADMIN_ALLOW_LAN: "false",
  DEV_ADMIN_EMAIL: "e2e-admin@example.test",
  DEV_ADMIN_PASSWORD_HASH: bcrypt.hashSync(testPassword, 12),
  DEV_ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
  DEV_ADMIN_SESSION_TTL_MINUTES: "60",
  DEV_PORTAL_DATA_DIRECTORY: dataDirectory,
  DEV_PORTAL_SIGNING_SECRET: randomBytes(32).toString("hex"),
  E2E_ADMIN_EMAIL: "e2e-admin@example.test",
  E2E_ADMIN_PASSWORD: testPassword,
  VITE_ADMIN_AUTH_MODE: "local-dev",
  VITE_DATA_BACKEND_MODE: "local-dev"
};

const args = [
  "playwright",
  "test",
  ...process.argv.slice(2)
];

const child = spawn("npx", args, {
  env,
  shell: process.platform === "win32",
  stdio: "inherit"
});

const exitCode = await new Promise((resolve) => {
  child.on("close", resolve);
});

await rm(dataDirectory, {
  force: true,
  recursive: true
});

process.exit(typeof exitCode === "number" ? exitCode : 1);
