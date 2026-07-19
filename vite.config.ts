import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import {
  localAdminAuthNotFoundPlugin,
  localAdminAuthPlugin
} from "./vite/plugins/local-admin-auth.plugin";
import {
  localPortalBackendNotFoundPlugin,
  localPortalBackendPlugin
} from "./vite/plugins/local-portal-backend.plugin";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableLocalAdminAuth =
    command === "serve" &&
    mode === "development" &&
    env.VITE_ADMIN_AUTH_MODE === "local-dev";
  const guardDisabledLocalAdminAuth = command === "serve" && !enableLocalAdminAuth;
  const enableLocalPortalBackend =
    command === "serve" &&
    mode === "development" &&
    env.VITE_DATA_BACKEND_MODE === "local-dev";
  const guardDisabledLocalPortalBackend = command === "serve" && !enableLocalPortalBackend;

  return {
    plugins: [
      react(),
      ...(enableLocalAdminAuth ? [localAdminAuthPlugin(env)] : []),
      ...(guardDisabledLocalAdminAuth ? [localAdminAuthNotFoundPlugin()] : []),
      ...(enableLocalPortalBackend ? [localPortalBackendPlugin(env)] : []),
      ...(guardDisabledLocalPortalBackend ? [localPortalBackendNotFoundPlugin()] : [])
    ],
    server: {
      host: "0.0.0.0",
      port: 5173
    },
    test: {
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "e2e/**"],
      globals: true,
      setupFiles: "./src/test/setup.ts"
    }
  };
});
