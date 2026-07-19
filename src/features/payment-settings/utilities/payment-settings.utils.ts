import type { PaymentSettingsFormValues } from "../types/payment-settings.types";

export const paymentSettingsDefaults: PaymentSettingsFormValues = {
  paymentEnabled: false,
  qrCodeFile: null,
  existingQrCodePath: "",
  upiId: "",
  payeeName: "",
  registrationFee: "",
  paymentTitle: "",
  paymentInstructions: "",
  publicSupportContact: "",
  paymentDeadline: ""
};

export const paymentSettingsFieldIds = {
  paymentEnabled: "payment-settings-enabled",
  qrCodeFile: "payment-settings-qr-code",
  existingQrCodePath: "payment-settings-existing-qr-code",
  upiId: "payment-settings-upi-id",
  payeeName: "payment-settings-payee-name",
  registrationFee: "payment-settings-registration-fee",
  paymentTitle: "payment-settings-title",
  paymentInstructions: "payment-settings-instructions",
  publicSupportContact: "payment-settings-public-contact",
  paymentDeadline: "payment-settings-deadline"
} as const;

export const paymentSettingsFieldLabels = {
  paymentEnabled: "ऑनलाइन भुगतान सक्षम करें",
  qrCodeFile: "QR कोड इमेज",
  existingQrCodePath: "मौजूदा QR कोड",
  upiId: "UPI आईडी",
  payeeName: "प्राप्तकर्ता का नाम",
  registrationFee: "पंजीकरण शुल्क",
  paymentTitle: "भुगतान शीर्षक",
  paymentInstructions: "भुगतान निर्देश",
  publicSupportContact: "सार्वजनिक सहायता संपर्क",
  paymentDeadline: "अंतिम तारीख और समय"
} as const;

export const paymentSettingsFieldOrder: (keyof PaymentSettingsFormValues)[] = [
  "paymentEnabled",
  "qrCodeFile",
  "upiId",
  "payeeName",
  "registrationFee",
  "paymentTitle",
  "paymentInstructions",
  "publicSupportContact",
  "paymentDeadline"
];

export function normalizeOptionalString(value: string | null | undefined): string | null {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function parsePaymentFeeInput(value: string | null | undefined): number | null {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) {
    return null;
  }

  const amount = Number(trimmedValue);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

export function getPaymentFeeValidationError(value: string | null | undefined): string | null {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    return "कृपया पंजीकरण शुल्क दर्ज करें।";
  }

  if (/e/i.test(trimmedValue) || !/^\d+(?:\.\d+)?$/.test(trimmedValue)) {
    return "कृपया मान्य शुल्क राशि दर्ज करें।";
  }

  if (/^\d+\.\d{3,}$/.test(trimmedValue)) {
    return "राशि में अधिकतम दो दशमलव अंक हो सकते हैं।";
  }

  const amount = Number(trimmedValue);

  if (!Number.isFinite(amount)) {
    return "कृपया मान्य शुल्क राशि दर्ज करें।";
  }

  if (amount <= 0) {
    return "पंजीकरण शुल्क 0 रुपये से अधिक होना चाहिए।";
  }

  if (amount > 100000) {
    return "पंजीकरण शुल्क 1,00,000 रुपये से अधिक नहीं हो सकता।";
  }

  return null;
}

export function formatPaymentSettingsAmount(amount: number | null, language: "hi" | "en" = "hi"): string {
  if (amount === null || !Number.isFinite(amount)) {
    return language === "en" ? "Incomplete" : "अपूर्ण";
  }

  return new Intl.NumberFormat(language === "en" ? "en-IN" : "hi-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    style: "currency"
  }).format(amount);
}

export function getFormattedDeadline(value: string | null | undefined, language: "hi" | "en" = "hi"): string {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    return language === "en" ? "Not determined" : "निर्धारित नहीं";
  }

  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    return language === "en" ? "Invalid date" : "अमान्य तारीख";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-IN" : "hi-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function getFuturePaymentDeadlineIso(value: string | null | undefined): string | null {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    return null;
  }

  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
