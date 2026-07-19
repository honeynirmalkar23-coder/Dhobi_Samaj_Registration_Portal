import { fileUploadLimits } from "../../../config/file-upload.config";

const acceptedQrExtensionsPattern = /\.(jpe?g|png|webp)$/i;

export function formatQrCodeFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAcceptedQrCodeMimeType(type: string): boolean {
  return fileUploadLimits.paymentQr.allowedMimeTypes.includes(
    type as (typeof fileUploadLimits.paymentQr.allowedMimeTypes)[number]
  );
}

export function isAcceptedQrCodeExtension(fileName: string): boolean {
  return acceptedQrExtensionsPattern.test(fileName);
}

export function getQrCodeValidationError(file: File | null, required = true): string | null {
  if (!file) {
    return required ? "ऑनलाइन भुगतान सक्षम करने के लिए QR कोड चुनें।" : null;
  }

  if (!isAcceptedQrCodeMimeType(file.type) || !isAcceptedQrCodeExtension(file.name)) {
    return "केवल JPG, JPEG, PNG या WebP QR इमेज स्वीकार की जाती है।";
  }

  if (file.size > fileUploadLimits.paymentQr.maxSizeMb * 1024 * 1024) {
    return "QR कोड इमेज का आकार 3 MB से अधिक नहीं होना चाहिए।";
  }

  if (file.size <= 0) {
    return "चयनित फाइल मान्य QR कोड इमेज नहीं है।";
  }

  return null;
}
