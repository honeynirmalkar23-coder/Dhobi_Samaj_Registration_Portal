import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadAcknowledgementPdf, getAcknowledgementFilename } from "./payment.service";

const registrationId = "DS-2026-000001";
const paymentAccessToken = "browser-session-payment-token";
const downloadUrl = `/api/local-portal/acknowledgements/${registrationId}.pdf?token=signed`;

describe("payment acknowledgement service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a non-empty PDF blob and acknowledgement filename", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("%PDF-1.7 test", {
      headers: {
        "Content-Type": "application/pdf"
      },
      status: 200
    })));

    const result = await downloadAcknowledgementPdf({
      downloadUrl,
      paymentAccessToken,
      registrationId
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.filename).toBe(getAcknowledgementFilename(registrationId));
      expect(result.data.blob.size).toBeGreaterThan(0);
    }
    expect(fetch).toHaveBeenCalledWith(downloadUrl, {
      credentials: "include",
      headers: {
        "X-Payment-Access-Token": paymentAccessToken
      }
    });
  });

  it("rejects empty PDF blobs and non-PDF content types", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("", {
        headers: {
          "Content-Type": "application/pdf"
        },
        status: 200
      }))
      .mockResolvedValueOnce(new Response("not pdf", {
        headers: {
          "Content-Type": "text/plain"
        },
        status: 200
      })));

    await expect(downloadAcknowledgementPdf({
      downloadUrl,
      paymentAccessToken,
      registrationId
    })).resolves.toMatchObject({
      code: "EMPTY_ACKNOWLEDGEMENT",
      ok: false
    });
    await expect(downloadAcknowledgementPdf({
      downloadUrl,
      paymentAccessToken,
      registrationId
    })).resolves.toMatchObject({
      code: "INVALID_ACKNOWLEDGEMENT_TYPE",
      ok: false
    });
  });

  it("returns a service failure for HTTP and network errors", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("forbidden", {
        status: 403
      }))
      .mockRejectedValueOnce(new Error("network failed")));

    await expect(downloadAcknowledgementPdf({
      downloadUrl,
      paymentAccessToken,
      registrationId
    })).resolves.toMatchObject({
      code: "ACKNOWLEDGEMENT_DOWNLOAD_FAILED",
      ok: false,
      status: 403
    });
    await expect(downloadAcknowledgementPdf({
      downloadUrl,
      paymentAccessToken,
      registrationId
    })).resolves.toMatchObject({
      code: "ACKNOWLEDGEMENT_NETWORK_ERROR",
      ok: false
    });
  });
});
