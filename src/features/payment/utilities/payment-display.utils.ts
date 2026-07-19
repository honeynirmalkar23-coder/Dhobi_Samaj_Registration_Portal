import type { PublicPaymentSettings } from "../types/payment.types";

export const placeholderPaymentSettings: PublicPaymentSettings = {
  paymentEnabled: false,
  qrCodeUrl: null,
  upiId: null,
  payeeName: null,
  amount: null,
  paymentTitle: null,
  instructions: null,
  publicContact: null,
  paymentDeadline: null
};

export function isPaymentConfigured(settings: PublicPaymentSettings): boolean {
  return Boolean(settings.paymentEnabled && settings.qrCodeUrl && settings.upiId);
}

export function formatPaymentAmount(amount: number | null, language: "hi" | "en" = "hi"): string {
  if (amount === null) {
    return language === "en" ? "Not configured" : "कॉन्फ़िगर नहीं";
  }

  return new Intl.NumberFormat(language === "en" ? "en-IN" : "hi-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    style: "currency"
  }).format(amount);
}
