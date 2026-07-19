import { fileUploadLimits } from "../../../config/file-upload.config";

export const paymentProofDefaults = {
  paymentScreenshot: null,
  declarationAccepted: false
} as const;

export const paymentProofFieldLabels = {
  paymentScreenshot: "भुगतान स्क्रीनशॉट",
  declarationAccepted: "घोषणा"
} as const;

export const paymentProofFieldIds = {
  paymentScreenshot: "payment-proof-screenshot",
  declarationAccepted: "payment-proof-declaration"
} as const;

export function formatPaymentProofFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAcceptedPaymentProofMimeType(type: string): boolean {
  return fileUploadLimits.paymentProof.allowedMimeTypes.includes(
    type as (typeof fileUploadLimits.paymentProof.allowedMimeTypes)[number]
  );
}

export function isAcceptedPaymentProofExtension(fileName: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(fileName);
}

export function getPaymentProofValidationError(file: File | null): string | null {
  if (!file) {
    return "कृपया भुगतान स्क्रीनशॉट चुनें।";
  }

  if (!isAcceptedPaymentProofMimeType(file.type) || !isAcceptedPaymentProofExtension(file.name)) {
    return "केवल JPG, JPEG, PNG या WebP स्क्रीनशॉट स्वीकार किए जाते हैं।";
  }

  if (file.size > fileUploadLimits.paymentProof.maxSizeMb * 1024 * 1024) {
    return "स्क्रीनशॉट का आकार 5 MB से अधिक नहीं होना चाहिए।";
  }

  if (file.size <= 0) {
    return "चयनित फाइल मान्य स्क्रीनशॉट नहीं है।";
  }

  return null;
}

export function getPaymentProofProgress(values: {
  paymentScreenshot: File | null;
  declarationAccepted: boolean;
}) {
  const checks = [
    getPaymentProofValidationError(values.paymentScreenshot) === null,
    values.declarationAccepted
  ];

  return {
    completed: checks.filter(Boolean).length,
    total: checks.length
  };
}
