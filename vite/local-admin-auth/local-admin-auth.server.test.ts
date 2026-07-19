import { createHmac } from "node:crypto";
import { EventEmitter } from "node:events";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { createLocalAdminAuthConfig } from "./local-admin-auth.config";
import { createLocalAdminAuthMiddleware } from "./local-admin-auth.server";
import { resetLocalAdminRateLimitForTests } from "./local-admin-rate-limit";
import {
  createLocalAdminSessionToken,
  verifyLocalAdminSessionToken
} from "./local-admin-session";
import type { LocalAdminAuthConfig } from "./local-admin-auth.types";

const adminEmail = "admin@example.test";
const password = "correct-password";
const sessionSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let passwordHash = "";

type TestResponse = {
  body: string;
  getHeader: (name: string) => number | string | string[] | undefined;
  headersSent: boolean;
  statusCode: number;
};

type InvokeRequestOptions = {
  body?: unknown;
  headers?: IncomingHttpHeaders;
  method?: string;
  origin?: string;
  path: string;
};

function signPayload(payload: unknown, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function createConfiguredAuth(): LocalAdminAuthConfig {
  return createLocalAdminAuthConfig({
    DEV_ADMIN_ALLOW_LAN: "false",
    DEV_ADMIN_EMAIL: adminEmail,
    DEV_ADMIN_PASSWORD_HASH: passwordHash,
    DEV_ADMIN_SESSION_SECRET: sessionSecret,
    DEV_ADMIN_SESSION_TTL_MINUTES: "480"
  });
}

class MockResponse extends EventEmitter {
  body = "";
  headersSent = false;
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

    this.headersSent = true;
    this.emit("finish");
    return this;
  }
}

function createMockRequest(options: InvokeRequestOptions): IncomingMessage {
  const body = options.body === undefined ? "" : JSON.stringify(options.body);
  const request = Readable.from([body]) as IncomingMessage;
  const origin = options.origin ?? "http://127.0.0.1:5173";

  Object.assign(request, {
    headers: {
      "content-type": "application/json",
      host: "127.0.0.1:5173",
      origin,
      "x-requested-with": "XMLHttpRequest",
      ...options.headers
    },
    method: options.method ?? "POST",
    socket: {
      encrypted: false,
      remoteAddress: "127.0.0.1"
    },
    url: options.path
  });

  return request;
}

function invokeLocalAuthRequest(
  config: LocalAdminAuthConfig,
  options: InvokeRequestOptions
): Promise<TestResponse> {
  const middleware = createLocalAdminAuthMiddleware(config);
  const request = createMockRequest(options);
  const response = new MockResponse();

  return new Promise((resolve) => {
    response.once("finish", () => resolve(response));
    middleware(request, response as unknown as ServerResponse, () => {
      response.statusCode = 404;
      response.end("Not Found");
    });
  });
}

function parseJsonResponse(response: TestResponse): unknown {
  return JSON.parse(response.body);
}

describe("local admin auth server", () => {
  beforeAll(() => {
    passwordHash = bcrypt.hashSync(password, 12);
  });

  afterEach(() => {
    resetLocalAdminRateLimitForTests();
  });

  it("validates missing local auth configuration safely", () => {
    expect(createLocalAdminAuthConfig({}).state).toBe("missing_email");
    expect(createLocalAdminAuthConfig({ DEV_ADMIN_EMAIL: adminEmail }).state).toBe(
      "missing_password_hash"
    );
    expect(
      createLocalAdminAuthConfig({
        DEV_ADMIN_EMAIL: adminEmail,
        DEV_ADMIN_PASSWORD_HASH: "not-a-bcrypt-hash"
      }).state
    ).toBe("invalid_password_hash");
    expect(
      createLocalAdminAuthConfig({
        DEV_ADMIN_EMAIL: adminEmail,
        DEV_ADMIN_PASSWORD_HASH: passwordHash
      }).state
    ).toBe("missing_session_secret");
  });

  it("logs in, restores the session from an HttpOnly cookie, and logs out", async () => {
    const config = createConfiguredAuth();
    const loginResponse = await invokeLocalAuthRequest(config, {
      body: {
        email: ` ${adminEmail.toUpperCase()} `,
        password
      },
      path: "/api/dev-admin-auth/login"
    });
    const loginBody = parseJsonResponse(loginResponse);
    const cookie = String(loginResponse.getHeader("set-cookie") ?? "");

    expect(loginResponse.statusCode).toBe(200);
    expect(cookie).toContain("dhobi_dev_admin_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(loginBody).toEqual({
      data: {
        authenticated: true,
        user: {
          authenticationMode: "local-dev",
          email: adminEmail,
          role: "admin"
        }
      },
      success: true
    });

    const sessionResponse = await invokeLocalAuthRequest(config, {
      headers: {
        cookie
      },
      method: "GET",
      path: "/api/dev-admin-auth/session"
    });

    expect(parseJsonResponse(sessionResponse)).toMatchObject({
      data: {
        authenticated: true,
        user: {
          email: adminEmail,
          role: "admin"
        }
      },
      success: true
    });

    const logoutResponse = await invokeLocalAuthRequest(config, {
      body: {},
      path: "/api/dev-admin-auth/logout"
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(String(logoutResponse.getHeader("set-cookie"))).toContain("Max-Age=0");
  });

  it("updates the local admin profile after verifying the current password", async () => {
    const config = createConfiguredAuth();
    const loginResponse = await invokeLocalAuthRequest(config, {
      body: {
        email: adminEmail,
        password
      },
      path: "/api/dev-admin-auth/login"
    });
    const cookie = String(loginResponse.getHeader("set-cookie") ?? "");
    const newPassword = "new-correct-password";
    const updateResponse = await invokeLocalAuthRequest(config, {
      body: {
        currentPassword: password,
        displayName: "Portal Admin",
        email: "portal-admin@example.test",
        newPassword
      },
      headers: {
        cookie
      },
      path: "/api/dev-admin-auth/profile"
    });
    const updateCookie = String(updateResponse.getHeader("set-cookie") ?? "");

    expect(updateResponse.statusCode).toBe(200);
    expect(parseJsonResponse(updateResponse)).toMatchObject({
      data: {
        passwordChanged: true,
        user: {
          authenticationMode: "local-dev",
          displayName: "Portal Admin",
          email: "portal-admin@example.test",
          role: "admin"
        }
      },
      success: true
    });
    expect(updateCookie).toContain("dhobi_dev_admin_session=");

    const updatedSessionResponse = await invokeLocalAuthRequest(config, {
      headers: {
        cookie: updateCookie
      },
      method: "GET",
      path: "/api/dev-admin-auth/session"
    });

    expect(parseJsonResponse(updatedSessionResponse)).toMatchObject({
      data: {
        authenticated: true,
        user: {
          displayName: "Portal Admin",
          email: "portal-admin@example.test"
        }
      },
      success: true
    });

    const newLoginResponse = await invokeLocalAuthRequest(config, {
      body: {
        email: "portal-admin@example.test",
        password: newPassword
      },
      path: "/api/dev-admin-auth/login"
    });

    expect(newLoginResponse.statusCode).toBe(200);
  });

  it("returns the same generic response for incorrect email and password without logging credentials", async () => {
    const config = createConfiguredAuth();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const wrongEmailResponse = await invokeLocalAuthRequest(config, {
        body: {
          email: "someone@example.test",
          password
        },
        path: "/api/dev-admin-auth/login"
      });
      const wrongPasswordResponse = await invokeLocalAuthRequest(config, {
        body: {
          email: adminEmail,
          password: "wrong-password"
        },
        path: "/api/dev-admin-auth/login"
      });

      expect(parseJsonResponse(wrongEmailResponse)).toEqual({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "ईमेल या पासवर्ड सही नहीं है।"
        },
        success: false
      });
      expect(parseJsonResponse(wrongPasswordResponse)).toEqual({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "ईमेल या पासवर्ड सही नहीं है।"
        },
        success: false
      });
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining(password));
      expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining(password));
    } finally {
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it("rate-limits repeated failed logins", async () => {
    const config = createConfiguredAuth();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await invokeLocalAuthRequest(config, {
        body: {
          email: "limited@example.test",
          password: ""
        },
        path: "/api/dev-admin-auth/login"
      });

      expect(response.statusCode).toBe(401);
    }

    const limitedResponse = await invokeLocalAuthRequest(config, {
      body: {
        email: "limited@example.test",
        password: ""
      },
      path: "/api/dev-admin-auth/login"
    });

    expect(limitedResponse.statusCode).toBe(429);
    expect(parseJsonResponse(limitedResponse)).toMatchObject({
      error: {
        code: "RATE_LIMITED"
      },
      success: false
    });
  });

  it("rejects unexpected origins and unsupported content types", async () => {
    const config = createConfiguredAuth();
    const badOriginResponse = await invokeLocalAuthRequest(config, {
      body: {
        email: adminEmail,
        password
      },
      origin: "http://192.168.1.10:5173",
      path: "/api/dev-admin-auth/login"
    });
    const badContentTypeResponse = await invokeLocalAuthRequest(config, {
      body: {},
      headers: {
        "content-type": "text/plain"
      },
      path: "/api/dev-admin-auth/login"
    });

    expect(badOriginResponse.statusCode).toBe(403);
    expect(badContentTypeResponse.statusCode).toBe(415);
  });
});

describe("local admin signed sessions", () => {
  it("rejects expired, tampered, and non-admin session tokens", () => {
    const validToken = createLocalAdminSessionToken({
      email: adminEmail,
      now: 1_000,
      secret: sessionSecret,
      ttlSeconds: 60
    });
    const tamperedToken = `${validToken.slice(0, -1)}x`;
    const wrongRoleToken = signPayload({
      authenticationMode: "local-dev",
      email: adminEmail,
      expiresAt: Date.now() + 60_000,
      issuedAt: Date.now(),
      role: "member"
    }, sessionSecret);

    expect(verifyLocalAdminSessionToken(validToken, sessionSecret, 2_000)).toMatchObject({
      email: adminEmail,
      role: "admin"
    });
    expect(verifyLocalAdminSessionToken(validToken, sessionSecret, 70_000)).toBeNull();
    expect(verifyLocalAdminSessionToken(tamperedToken, sessionSecret, 2_000)).toBeNull();
    expect(verifyLocalAdminSessionToken(wrongRoleToken, sessionSecret)).toBeNull();
  });
});
