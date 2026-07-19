import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { localAdminAuthNotFoundPlugin } from "./local-admin-auth.plugin";

type Middleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => void;

class MockResponse extends EventEmitter {
  body = "";
  statusCode = 200;

  private readonly headers = new Map<string, number | string | string[]>();

  setHeader(name: string, value: number | string | string[]): this {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }

  getHeader(name: string): number | string | string[] | undefined {
    return this.headers.get(name.toLowerCase());
  }

  end(chunk?: unknown): this {
    if (chunk !== undefined) {
      this.body += String(chunk);
    }

    this.emit("finish");
    return this;
  }
}

function getMiddleware(): Middleware {
  const plugin = localAdminAuthNotFoundPlugin();
  const middlewareUse = vi.fn();

  plugin.configureServer?.({
    middlewares: {
      use: middlewareUse
    }
  } as never);

  return middlewareUse.mock.calls[0]?.[0] as Middleware;
}

describe("local admin auth Vite plugin guards", () => {
  it("returns 404 for local auth endpoints when local mode is disabled", () => {
    const middleware = getMiddleware();
    const response = new MockResponse();

    middleware(
      {
        url: "/api/dev-admin-auth/session"
      } as IncomingMessage,
      response as unknown as ServerResponse,
      vi.fn()
    );

    expect(response.statusCode).toBe(404);
    expect(response.getHeader("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.body).toBe("Not Found");
  });

  it("passes non-local-auth routes to the next middleware", () => {
    const middleware = getMiddleware();
    const next = vi.fn();

    middleware(
      {
        url: "/admin/login"
      } as IncomingMessage,
      new MockResponse() as unknown as ServerResponse,
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});
