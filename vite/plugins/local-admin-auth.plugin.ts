// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { createLocalAdminAuthConfig } from "../local-admin-auth/local-admin-auth.config";
import { createLocalAdminAuthMiddleware } from "../local-admin-auth/local-admin-auth.server";

const localAdminAuthEndpointPrefix = "/api/dev-admin-auth";

function createLocalAdminAuthNotFoundMiddleware() {
  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = new URL(request.url ?? "/", "http://local-dev.invalid");

    if (!url.pathname.startsWith(localAdminAuthEndpointPrefix)) {
      next();
      return;
    }

    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Not Found");
  };
}

export function localAdminAuthPlugin(env: Record<string, string | undefined>): Plugin {
  const config = createLocalAdminAuthConfig(env);

  return {
    configureServer(server) {
      server.middlewares.use(createLocalAdminAuthMiddleware(config));
    },
    name: "dhobi-local-admin-auth",
    apply: "serve"
  };
}

export function localAdminAuthNotFoundPlugin(): Plugin {
  return {
    configureServer(server) {
      server.middlewares.use(createLocalAdminAuthNotFoundMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createLocalAdminAuthNotFoundMiddleware());
    },
    name: "dhobi-local-admin-auth-disabled",
    apply: "serve"
  };
}
