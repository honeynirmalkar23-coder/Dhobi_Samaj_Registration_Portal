import { createHmac } from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalAdminSessionToken } from "../local-admin-auth/local-admin-session";
import { createLocalPortalConfig } from "./local-portal.config";
import { createLocalPortalContext } from "./local-portal.database";
import {
  handleAdminDatabaseExportClear,
  handleAdminRegistrationExportRows
} from "./local-portal.database-export";
import { generateRegistrationId } from "./local-portal.registration-id";
import type { LocalPortalConfig } from "./local-portal.types";

const signingSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const adminSessionSecret = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const adminEmail = "admin@example.test";

let tempRoots: string[] = [];

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

type JsonResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

async function createTempRoot() {
  const root = await mkdtemp(join(tmpdir(), "dhobi-export-clear-"));
  tempRoots.push(root);

  return root;
}

function signPayload(payload: unknown, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function createConfig(projectRoot: string): Extract<LocalPortalConfig, { state: "configured" }> {
  const config = createLocalPortalConfig({
    DEV_ADMIN_SESSION_SECRET: adminSessionSecret,
    DEV_PORTAL_DATA_DIRECTORY: ".local-data",
    DEV_PORTAL_SIGNING_SECRET: signingSecret,
    VITE_DATA_BACKEND_MODE: "local-dev"
  }, projectRoot);

  if (config.state !== "configured") {
    throw new Error("expected configured local portal");
  }

  return config;
}

function createAdminCookie(role: "admin" | "member" = "admin"): string {
  if (role === "admin") {
    return `dhobi_dev_admin_session=${createLocalAdminSessionToken({
      email: adminEmail,
      secret: adminSessionSecret,
      ttlSeconds: 60 * 60
    })}`;
  }

  return `dhobi_dev_admin_session=${signPayload({
    authenticationMode: "local-dev",
    email: adminEmail,
    expiresAt: Date.now() + 60 * 60 * 1000,
    issuedAt: Date.now(),
    role
  }, adminSessionSecret)}`;
}

function createRequest(params: {
  body?: unknown;
  cookie?: string;
  method: string;
  path: string;
}): IncomingMessage {
  const body = params.body === undefined ? "" : JSON.stringify(params.body);
  const request = Readable.from([body]) as IncomingMessage;
  const headers: Record<string, string> = {
    host: "127.0.0.1:5173",
    origin: "http://127.0.0.1:5173",
    "x-forwarded-for": "203.0.113.10",
    "x-requested-with": "XMLHttpRequest"
  };

  if (params.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (params.cookie) {
    headers.cookie = params.cookie;
  }

  Object.assign(request, {
    headers,
    method: params.method,
    socket: {
      encrypted: false,
      remoteAddress: "127.0.0.1"
    },
    url: params.path
  });

  return request;
}

function parseResponse<T>(response: MockResponse): JsonResponse<T> {
  return JSON.parse(response.body) as JsonResponse<T>;
}

function insertRegistration(
  db: NonNullable<ReturnType<typeof createLocalPortalContext>["db"]>,
  params: {
    id: string;
    registrationId: string;
    fullName: string;
    createdAt: string;
    paymentStatus?: string;
  }
): void {
  db.prepare(`
    INSERT INTO registrations (
      id,
      registration_id,
      full_name,
      age,
      education_level,
      education_details,
      permanent_address,
      boys_count,
      girls_count,
      elders_count,
      total_family_members,
      applicant_photo_path,
      applicant_photo_mime_type,
      applicant_photo_size_bytes,
      registration_status,
      payment_status,
      payment_access_token_hash,
      payment_access_token_expires_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, 34, 'graduate', 'Graduate', 'Ward 1, Test Village', 1, 2, 1, 4, ?, 'image/png', 64, 'submitted', ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.registrationId,
    params.fullName,
    `applicant-photos/${params.id}.png`,
    params.paymentStatus ?? "pending_verification",
    `${params.id}-token-hash-value-that-is-long-enough`,
    "2026-08-20T00:00:00.000Z",
    params.createdAt,
    params.createdAt
  );
}

function insertPaymentProof(
  db: NonNullable<ReturnType<typeof createLocalPortalContext>["db"]>,
  registrationRecordId: string,
  proofId: string
): void {
  db.prepare(`
    INSERT INTO payment_proofs (
      id,
      registration_record_id,
      storage_path,
      original_filename,
      mime_type,
      size_bytes,
      proof_status,
      acknowledgement_number,
      submitted_at,
      created_at
    )
    VALUES (?, ?, ?, 'proof.png', 'image/png', 64, 'pending_verification', ?, '2026-07-20T00:00:00.000Z', '2026-07-20T00:00:00.000Z')
  `).run(proofId, registrationRecordId, `payment-proofs/${proofId}.png`, `ACK-${proofId}`);
}

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, {
    force: true,
    recursive: true
  })));
  tempRoots = [];
});

describe("local admin database export and clear", () => {
  it("exports an empty database without errors", async () => {
    const config = createConfig(await createTempRoot());
    const context = createLocalPortalContext(config);

    if (!context.db) {
      throw new Error("database unavailable");
    }

    const response = new MockResponse();
    handleAdminRegistrationExportRows({
      config,
      db: context.db,
      request: createRequest({
        cookie: createAdminCookie(),
        method: "GET",
        path: "/api/local-portal/admin/database/export-rows"
      }),
      response: response as unknown as ServerResponse
    });

    expect(response.statusCode).toBe(200);
    expect(parseResponse<unknown[]>(response).data).toEqual([]);

    context.db.close();
  });

  it("exports all registration rows with payment amount and requested columns", async () => {
    const config = createConfig(await createTempRoot());
    const context = createLocalPortalContext(config);

    if (!context.db) {
      throw new Error("database unavailable");
    }

    context.db.prepare("UPDATE payment_settings SET amount = 501 WHERE id = 1").run();
    insertRegistration(context.db, {
      createdAt: "2026-07-20T00:00:00.000Z",
      fullName: "Export User",
      id: "record-1",
      registrationId: "DS-2026-000001"
    });

    const response = new MockResponse();
    handleAdminRegistrationExportRows({
      config,
      db: context.db,
      request: createRequest({
        cookie: createAdminCookie(),
        method: "GET",
        path: "/api/local-portal/admin/database/export-rows"
      }),
      response: response as unknown as ServerResponse
    });

    const body = parseResponse<Array<Record<string, unknown>>>(response);

    expect(body.data).toEqual([
      expect.objectContaining({
        address: "Ward 1, Test Village",
        boys: 1,
        dob: null,
        elderly: 1,
        fullName: "Export User",
        girls: 2,
        mobileNumber: null,
        paymentAmount: 501,
        paymentReference: null,
        paymentStatus: "pending_verification",
        paymentUtr: null,
        registrationId: "DS-2026-000001"
      })
    ]);

    context.db.close();
  });

  it("clears records transactionally, resets counters, and writes an audit entry", async () => {
    const config = createConfig(await createTempRoot());
    const context = createLocalPortalContext(config);

    if (!context.db) {
      throw new Error("database unavailable");
    }

    context.db.prepare(`
      INSERT INTO registration_counters (registration_year, last_value, updated_at)
      VALUES (2026, 2, '2026-07-20T00:00:00.000Z')
    `).run();
    insertRegistration(context.db, {
      createdAt: "2026-07-20T00:00:00.000Z",
      fullName: "First User",
      id: "record-1",
      registrationId: "DS-2026-000001"
    });
    insertRegistration(context.db, {
      createdAt: "2026-07-20T00:01:00.000Z",
      fullName: "Second User",
      id: "record-2",
      registrationId: "DS-2026-000002"
    });
    insertPaymentProof(context.db, "record-1", "proof-1");
    insertPaymentProof(context.db, "record-2", "proof-2");

    const response = new MockResponse();
    await handleAdminDatabaseExportClear({
      config,
      db: context.db,
      request: createRequest({
        body: {
          expectedExportedRows: 2,
          filename: "registrations_2026-07-20_00-35.csv"
        },
        cookie: createAdminCookie(),
        method: "POST",
        path: "/api/local-portal/admin/database/export-clear"
      }),
      response: response as unknown as ServerResponse
    });

    const body = parseResponse<{
      deletedRows: number;
      exportedRows: number;
      filename: string;
    }>(response);
    const audit = context.db.prepare(`
      SELECT action, administrator_email, metadata
      FROM admin_audit_logs
      WHERE action = 'EXPORT_AND_CLEAR_DATABASE'
    `).get() as {
      action: string;
      administrator_email: string;
      metadata: string;
    };

    expect(response.statusCode).toBe(200);
    expect(body.data).toMatchObject({
      deletedRows: 2,
      exportedRows: 2,
      filename: "registrations_2026-07-20_00-35.csv"
    });
    expect(context.db.prepare("SELECT COUNT(*) FROM registrations").pluck().get()).toBe(0);
    expect(context.db.prepare("SELECT COUNT(*) FROM payment_proofs").pluck().get()).toBe(0);
    expect(context.db.prepare("SELECT COUNT(*) FROM registration_counters").pluck().get()).toBe(0);
    expect(audit.administrator_email).toBe(adminEmail);
    expect(JSON.parse(audit.metadata)).toMatchObject({
      csvFilename: "registrations_2026-07-20_00-35.csv",
      deletedPaymentProofs: 2,
      deletedRows: 2,
      exportedRows: 2,
      ipAddress: "203.0.113.10",
      success: true
    });
    expect(generateRegistrationId(context.db, new Date("2026-07-20T00:00:00.000Z"))).toBe("DS-2026-000001");

    context.db.close();
  });

  it("keeps registration data when a delete inside the transaction fails", async () => {
    const config = createConfig(await createTempRoot());
    const context = createLocalPortalContext(config);

    if (!context.db) {
      throw new Error("database unavailable");
    }

    context.db.prepare(`
      INSERT INTO registration_counters (registration_year, last_value, updated_at)
      VALUES (2026, 1, '2026-07-20T00:00:00.000Z')
    `).run();
    insertRegistration(context.db, {
      createdAt: "2026-07-20T00:00:00.000Z",
      fullName: "Rollback User",
      id: "record-1",
      registrationId: "DS-2026-000001"
    });
    insertPaymentProof(context.db, "record-1", "proof-1");
    context.db.exec(`
      CREATE TRIGGER block_payment_proof_delete
      BEFORE DELETE ON payment_proofs
      BEGIN
        SELECT RAISE(ABORT, 'blocked proof delete');
      END;
    `);

    const response = new MockResponse();
    await handleAdminDatabaseExportClear({
      config,
      db: context.db,
      request: createRequest({
        body: {
          expectedExportedRows: 1,
          filename: "registrations_2026-07-20_00-35.csv"
        },
        cookie: createAdminCookie(),
        method: "POST",
        path: "/api/local-portal/admin/database/export-clear"
      }),
      response: response as unknown as ServerResponse
    });

    const body = parseResponse<never>(response);
    const failureAudit = context.db.prepare(`
      SELECT metadata
      FROM admin_audit_logs
      WHERE action = 'EXPORT_AND_CLEAR_DATABASE'
    `).get() as { metadata: string };

    expect(response.statusCode).toBe(500);
    expect(body.error?.code).toBe("EXPORT_CLEAR_FAILED");
    expect(context.db.prepare("SELECT COUNT(*) FROM registrations").pluck().get()).toBe(1);
    expect(context.db.prepare("SELECT COUNT(*) FROM payment_proofs").pluck().get()).toBe(1);
    expect(context.db.prepare("SELECT COUNT(*) FROM registration_counters").pluck().get()).toBe(1);
    expect(JSON.parse(failureAudit.metadata)).toMatchObject({
      failureCode: "EXPORT_CLEAR_FAILED",
      success: false
    });

    context.db.close();
  });

  it("rejects missing and non-admin sessions", async () => {
    const config = createConfig(await createTempRoot());
    const context = createLocalPortalContext(config);

    if (!context.db) {
      throw new Error("database unavailable");
    }

    const unauthorizedResponse = new MockResponse();
    await handleAdminDatabaseExportClear({
      config,
      db: context.db,
      request: createRequest({
        body: {
          expectedExportedRows: 0,
          filename: "registrations_2026-07-20.csv"
        },
        method: "POST",
        path: "/api/local-portal/admin/database/export-clear"
      }),
      response: unauthorizedResponse as unknown as ServerResponse
    });

    const nonAdminResponse = new MockResponse();
    await handleAdminDatabaseExportClear({
      config,
      db: context.db,
      request: createRequest({
        body: {
          expectedExportedRows: 0,
          filename: "registrations_2026-07-20.csv"
        },
        cookie: createAdminCookie("member"),
        method: "POST",
        path: "/api/local-portal/admin/database/export-clear"
      }),
      response: nonAdminResponse as unknown as ServerResponse
    });

    expect(unauthorizedResponse.statusCode).toBe(401);
    expect(nonAdminResponse.statusCode).toBe(401);
    expect(context.db.prepare("SELECT COUNT(*) FROM registrations").pluck().get()).toBe(0);

    context.db.close();
  });
});
