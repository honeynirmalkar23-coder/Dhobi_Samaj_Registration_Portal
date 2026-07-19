import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalPortalConfig } from "./local-portal.config";
import { createLocalPortalContext } from "./local-portal.database";
import { handleAcknowledgementPdf } from "./local-portal.pdf";
import { createPaymentAccessToken, createSignedPortalToken } from "./local-portal.tokens";

const signingSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

let tempRoots: string[] = [];

async function createTempRoot() {
  const root = await mkdtemp(join(tmpdir(), "dhobi-local-pdf-"));
  tempRoots.push(root);

  return root;
}

class BufferResponse extends Writable {
  readonly chunks: Buffer[] = [];
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

  _write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }

  getBody(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

function createGetRequest(paymentAccessToken: string): IncomingMessage {
  const request = Readable.from([]) as IncomingMessage;

  Object.assign(request, {
    headers: {
      "x-payment-access-token": paymentAccessToken
    },
    method: "GET"
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

describe("local acknowledgement PDF", () => {
  it("generates a compact acknowledgement without footer-only pages", async () => {
    const projectRoot = await createTempRoot();
    const config = createLocalPortalConfig({
      DEV_PORTAL_DATA_DIRECTORY: ".local-data",
      DEV_PORTAL_SIGNING_SECRET: signingSecret,
      VITE_DATA_BACKEND_MODE: "local-dev"
    }, projectRoot);
    const context = createLocalPortalContext(config);

    if (config.state !== "configured" || !context.db) {
      throw new Error("local portal context unavailable");
    }

    const registrationId = "DS-2026-000001";
    const registrationRecordId = randomUUID();
    const acknowledgementNumber = `ACK-${registrationId}-TEST`;
    const now = "2026-07-16T16:00:00.000Z";
    const paymentAccessToken = createPaymentAccessToken();
    const proofDirectory = join(config.uploadsDirectory, "payment-proofs");

    await mkdir(proofDirectory, {
      recursive: true
    });
    await writeFile(join(proofDirectory, "proof.png"), onePixelPng);

    context.db.prepare(`
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
        payment_submitted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'pending_verification', ?, ?, ?, ?, ?)
    `).run(
      registrationRecordId,
      registrationId,
      "Yogesh Kumar Bandhe",
      26,
      "graduate",
      "CSE",
      "Raipur Chhattisgarh India",
      1,
      1,
      2,
      4,
      "applicant-photos/photo.jpg",
      "image/jpeg",
      1024,
      paymentAccessToken.tokenHash,
      "2026-08-16T16:00:00.000Z",
      now,
      now,
      now
    );
    context.db.prepare(`
      UPDATE payment_settings
      SET
        payment_enabled = 1,
        upi_id = 'yogendrakumar.yk0199@oksbi',
        payee_name = 'Yogendra Kumar Bandhe',
        amount = 100,
        payment_title = 'Dhobi Samaj Local Registration Fee',
        instructions = 'Make payment and upload the screenshot.',
        public_contact = 'Configured support contact',
        updated_at = ?
      WHERE id = 1
    `).run(now);
    context.db.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, 'pending_verification', ?, ?, ?)
    `).run(
      randomUUID(),
      registrationRecordId,
      "payment-proofs/proof.png",
      "proof.png",
      "image/png",
      onePixelPng.length,
      acknowledgementNumber,
      now,
      now
    );

    const token = createSignedPortalToken({
      acknowledgementNumber,
      expiresAt: Date.now() + 30 * 60 * 1000,
      purpose: "acknowledgement",
      registrationId
    }, signingSecret);
    const response = new BufferResponse();

    handleAcknowledgementPdf({
      config,
      db: context.db,
      request: createGetRequest(paymentAccessToken.token),
      response: response as unknown as ServerResponse,
      url: new URL(`/api/local-portal/acknowledgements/${registrationId}.pdf?token=${encodeURIComponent(token)}`, "http://local.test")
    });

    await new Promise<void>((resolve) => {
      response.on("finish", resolve);
    });

    const pdfBuffer = response.getBody();
    const pdfSource = pdfBuffer.toString("latin1");
    const pageCountMatch = pdfSource.match(/\/Count\s+(\d+)/);
    const pageCount = pageCountMatch?.[1] ? Number(pageCountMatch[1]) : 0;

    expect(response.statusCode).toBe(200);
    expect(response.getHeader("content-type")).toBe("application/pdf");
    expect(pdfBuffer.toString("utf8", 0, 5)).toBe("%PDF-");
    expect(pageCount).toBeGreaterThan(0);
    expect(pageCount).toBeLessThanOrEqual(3);

    context.db.close();
  });
});
