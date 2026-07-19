import { mkdtemp, rm } from "node:fs/promises";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalAdminSessionToken } from "../local-admin-auth/local-admin-session";
import { handleAdminDashboardMetrics } from "./local-portal.admin-data";
import { createLocalPortalConfig } from "./local-portal.config";
import { createLocalPortalContext } from "./local-portal.database";
import { handleAdminPaymentSettingsGet } from "./local-portal.payment-settings";
import { generateRegistrationId } from "./local-portal.registration-id";

const signingSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const adminSessionSecret = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const adminEmail = "admin@example.test";

let tempRoots: string[] = [];

async function createTempRoot() {
  const root = await mkdtemp(join(tmpdir(), "dhobi-local-portal-"));
  tempRoots.push(root);

  return root;
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

  end(chunk?: unknown): this {
    if (chunk !== undefined) {
      this.body += String(chunk);
    }

    this.headersSent = true;
    this.emit("finish");
    return this;
  }
}

function createAdminGetRequest(): IncomingMessage {
  const token = createLocalAdminSessionToken({
    email: adminEmail,
    secret: adminSessionSecret,
    ttlSeconds: 60 * 60
  });
  const request = Readable.from([]) as IncomingMessage;

  Object.assign(request, {
    headers: {
      cookie: `dhobi_dev_admin_session=${token}`,
      host: "127.0.0.1:5173"
    },
    method: "GET",
    socket: {
      remoteAddress: "127.0.0.1"
    },
    url: "/api/local-portal/admin/payment-settings"
  });

  return request;
}

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, {
    force: true,
    recursive: true
  })));
  tempRoots = [];
});

describe("local portal backend configuration and database", () => {
  it("is disabled unless local data backend mode is requested", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({}, projectRoot);

    expect(config.state).toBe("disabled");
  });

  it("requires a server-only signing secret in local data mode", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({
      VITE_DATA_BACKEND_MODE: "local-dev"
    }, projectRoot);

    expect(config.state).toBe("missing_signing_secret");
    expect(config.missingVariables).toEqual(["DEV_PORTAL_SIGNING_SECRET"]);
  });

  it("creates schema, default payment settings, and idempotent migrations", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({
      DEV_PORTAL_DATA_DIRECTORY: ".local-data",
      DEV_PORTAL_SIGNING_SECRET: signingSecret,
      VITE_DATA_BACKEND_MODE: "local-dev"
    }, projectRoot);
    const firstContext = createLocalPortalContext(config);
    const secondContext = createLocalPortalContext(config);

    expect(firstContext.config.state).toBe("configured");
    expect(firstContext.db?.prepare("SELECT COUNT(*) FROM local_schema_versions").pluck().get()).toBe(1);
    expect(firstContext.db?.prepare("SELECT payment_enabled FROM payment_settings WHERE id = 1").pluck().get()).toBe(0);
    expect(secondContext.db?.prepare("SELECT COUNT(*) FROM local_schema_versions").pluck().get()).toBe(1);

    firstContext.db?.close();
    secondContext.db?.close();
  });

  it("generates sequential registration IDs with the Kolkata calendar year", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({
      DEV_PORTAL_DATA_DIRECTORY: ".local-data",
      DEV_PORTAL_SIGNING_SECRET: signingSecret,
      VITE_DATA_BACKEND_MODE: "local-dev"
    }, projectRoot);
    const context = createLocalPortalContext(config);

    if (!context.db) {
      throw new Error("database unavailable");
    }

    expect(generateRegistrationId(context.db, new Date("2026-01-01T00:00:00.000Z"))).toBe("DS-2026-000001");
    expect(generateRegistrationId(context.db, new Date("2026-01-01T00:00:01.000Z"))).toBe("DS-2026-000002");

    context.db.close();
  });

  it("returns an opaque QR reference instead of a private storage path in local admin settings", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({
      DEV_ADMIN_SESSION_SECRET: adminSessionSecret,
      DEV_PORTAL_DATA_DIRECTORY: ".local-data",
      DEV_PORTAL_SIGNING_SECRET: signingSecret,
      VITE_DATA_BACKEND_MODE: "local-dev"
    }, projectRoot);
    const context = createLocalPortalContext(config);

    if (config.state !== "configured" || !context.db) {
      throw new Error("database unavailable");
    }

    context.db.prepare(`
      UPDATE payment_settings
      SET qr_code_path = 'payment-qr-codes/private-qr.png',
          qr_code_mime_type = 'image/png',
          qr_code_size_bytes = 64
      WHERE id = 1
    `).run();

    const response = new MockResponse();
    handleAdminPaymentSettingsGet({
      config,
      db: context.db,
      request: createAdminGetRequest(),
      response: response as unknown as ServerResponse
    });

    const body = JSON.parse(response.body) as {
      data: {
        qrCodePath: string | null;
        qrCodeSignedUrl: string | null;
      };
      success: boolean;
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.qrCodePath).toBe("existing-qr-code");
    expect(body.data.qrCodeSignedUrl).toContain("/api/local-portal/files?token=");
    expect(response.body).not.toContain("payment-qr-codes/private-qr.png");

    context.db.close();
  });

  it("returns dashboard metrics without binding undefined parameters to SQLite statements", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({
      DEV_ADMIN_SESSION_SECRET: adminSessionSecret,
      DEV_PORTAL_DATA_DIRECTORY: ".local-data",
      DEV_PORTAL_SIGNING_SECRET: signingSecret,
      VITE_DATA_BACKEND_MODE: "local-dev"
    }, projectRoot);
    const context = createLocalPortalContext(config);

    if (config.state !== "configured" || !context.db) {
      throw new Error("database unavailable");
    }

    const response = new MockResponse();
    handleAdminDashboardMetrics({
      config,
      db: context.db,
      request: createAdminGetRequest(),
      response: response as unknown as ServerResponse
    });

    const body = JSON.parse(response.body) as {
      data: {
        totalRegistrations: number;
        awaitingPayment: number;
        pendingVerification: number;
      };
      success: boolean;
    };

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      awaitingPayment: 0,
      pendingVerification: 0,
      totalRegistrations: 0
    });

    context.db.close();
  });
});
