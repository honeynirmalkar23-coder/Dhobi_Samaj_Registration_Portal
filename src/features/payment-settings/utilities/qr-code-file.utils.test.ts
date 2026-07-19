import { describe, expect, it } from "vitest";
import { fileUploadLimits } from "../../../config/file-upload.config";
import {
  formatQrCodeFileSize,
  getQrCodeValidationError,
  isAcceptedQrCodeExtension,
  isAcceptedQrCodeMimeType
} from "./qr-code-file.utils";

function createFile(name: string, type: string, size = 32) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("QR code file utilities", () => {
  it("uses the centralized 3 MB payment QR configuration", () => {
    expect(fileUploadLimits.paymentQr.maxSizeMb).toBe(3);
    expect(fileUploadLimits.paymentQr.allowedMimeTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp"
    ]);
  });

  it("accepts JPG, JPEG, PNG, and WebP QR images", () => {
    expect(isAcceptedQrCodeMimeType("image/jpeg")).toBe(true);
    expect(isAcceptedQrCodeMimeType("image/png")).toBe(true);
    expect(isAcceptedQrCodeMimeType("image/webp")).toBe(true);
    expect(isAcceptedQrCodeExtension("qr.jpg")).toBe(true);
    expect(isAcceptedQrCodeExtension("qr.jpeg")).toBe(true);
    expect(isAcceptedQrCodeExtension("qr.png")).toBe(true);
    expect(isAcceptedQrCodeExtension("qr.webp")).toBe(true);
    expect(getQrCodeValidationError(createFile("qr.png", "image/png"))).toBeNull();
  });

  it("rejects unsupported, renamed, oversized, and empty files", () => {
    expect(getQrCodeValidationError(null)).toBe("ऑनलाइन भुगतान सक्षम करने के लिए QR कोड चुनें।");
    expect(getQrCodeValidationError(null, false)).toBeNull();
    expect(getQrCodeValidationError(createFile("qr.pdf", "application/pdf"))).toBe(
      "केवल JPG, JPEG, PNG या WebP QR इमेज स्वीकार की जाती है।"
    );
    expect(getQrCodeValidationError(createFile("qr.png", "application/pdf"))).toBe(
      "केवल JPG, JPEG, PNG या WebP QR इमेज स्वीकार की जाती है।"
    );
    expect(
      getQrCodeValidationError(createFile("qr.jpg", "image/jpeg", 3 * 1024 * 1024 + 1))
    ).toBe("QR कोड इमेज का आकार 3 MB से अधिक नहीं होना चाहिए।");
    expect(getQrCodeValidationError(createFile("qr.jpg", "image/jpeg", 0))).toBe(
      "चयनित फाइल मान्य QR कोड इमेज नहीं है।"
    );
  });

  it("formats QR file sizes for display", () => {
    expect(formatQrCodeFileSize(500)).toBe("1 KB");
    expect(formatQrCodeFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
