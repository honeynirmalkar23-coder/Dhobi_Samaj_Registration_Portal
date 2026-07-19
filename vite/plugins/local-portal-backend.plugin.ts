// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Plugin } from "vite";
import { createLocalPortalConfig } from "../local-portal-backend/local-portal.config";
import { createLocalPortalContext } from "../local-portal-backend/local-portal.database";
import {
  createLocalPortalBackendMiddleware,
  createLocalPortalNotFoundMiddleware
} from "../local-portal-backend/local-portal.router";

export function localPortalBackendPlugin(env: Record<string, string | undefined>): Plugin {
  const config = createLocalPortalConfig(env);
  const context = createLocalPortalContext(config);

  return {
    configureServer(server) {
      server.middlewares.use(createLocalPortalBackendMiddleware(context));
    },
    name: "dhobi-local-portal-backend",
    apply: "serve"
  };
}

export function localPortalBackendNotFoundPlugin(): Plugin {
  return {
    configureServer(server) {
      server.middlewares.use(createLocalPortalNotFoundMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createLocalPortalNotFoundMiddleware());
    },
    name: "dhobi-local-portal-backend-disabled",
    apply: "serve"
  };
}
