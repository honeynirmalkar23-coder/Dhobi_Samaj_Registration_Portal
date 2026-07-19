// SERVER-SIDE DEVELOPMENT CODE ONLY

import { mkdirSync } from "node:fs";
import { resolve, sep } from "node:path";
import type { LocalPortalConfig } from "./local-portal.types";

const defaultDataDirectory = ".local-data";
const minimumSigningSecretLength = 32;

function isInsideProjectRoot(projectRoot: string, target: string): boolean {
  return target === projectRoot || target.startsWith(`${projectRoot}${sep}`);
}

function createDisabledConfig(projectRoot: string, allowLan: boolean): LocalPortalConfig {
  return {
    allowLan,
    missingVariables: [],
    projectRoot,
    state: "disabled"
  };
}

export function createLocalPortalConfig(
  env: Record<string, string | undefined>,
  projectRoot = process.cwd()
): LocalPortalConfig {
  const allowLan = env.DEV_ADMIN_ALLOW_LAN === "true";

  if (env.VITE_DATA_BACKEND_MODE !== "local-dev") {
    return createDisabledConfig(projectRoot, allowLan);
  }

  const signingSecret = env.DEV_PORTAL_SIGNING_SECRET?.trim() ?? "";
  const requestedDataDirectory = env.DEV_PORTAL_DATA_DIRECTORY?.trim() || defaultDataDirectory;
  const dataDirectory = resolve(projectRoot, requestedDataDirectory);

  if (!isInsideProjectRoot(projectRoot, dataDirectory)) {
    return {
      allowLan,
      missingVariables: ["DEV_PORTAL_DATA_DIRECTORY"],
      projectRoot,
      state: "invalid_data_directory"
    };
  }

  if (!signingSecret) {
    return {
      allowLan,
      missingVariables: ["DEV_PORTAL_SIGNING_SECRET"],
      projectRoot,
      state: "missing_signing_secret"
    };
  }

  if (signingSecret.length < minimumSigningSecretLength) {
    return {
      allowLan,
      missingVariables: ["DEV_PORTAL_SIGNING_SECRET"],
      projectRoot,
      state: "invalid_signing_secret"
    };
  }

  const uploadsDirectory = resolve(dataDirectory, "uploads");
  const temporaryDirectory = resolve(dataDirectory, "temporary");

  mkdirSync(resolve(uploadsDirectory, "applicant-photos"), { recursive: true });
  mkdirSync(resolve(uploadsDirectory, "payment-proofs"), { recursive: true });
  mkdirSync(resolve(uploadsDirectory, "payment-qr-codes"), { recursive: true });
  mkdirSync(temporaryDirectory, { recursive: true });

  return {
    adminSessionSecret: env.DEV_ADMIN_SESSION_SECRET?.trim() || null,
    allowLan,
    dataDirectory,
    databasePath: resolve(dataDirectory, "portal.sqlite"),
    projectRoot,
    signingSecret,
    state: "configured",
    temporaryDirectory,
    uploadsDirectory
  };
}

