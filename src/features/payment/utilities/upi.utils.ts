import type { PublicPaymentSettings } from "../types/payment.types";

const UPI_ID_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export function normalizeUpiId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidUpiId(value: string | null | undefined): boolean {
  const normalizedValue = normalizeUpiId(value);

  if (!normalizedValue) {
    return false;
  }

  return UPI_ID_PATTERN.test(normalizedValue);
}

export function buildUpiDeepLink(settings: PublicPaymentSettings): string | null {
  const upiId = normalizeUpiId(settings.upiId);

  if (!isValidUpiId(upiId)) {
    return null;
  }

  const params = new URLSearchParams({
    pa: upiId
  });

  const payeeName = typeof settings.payeeName === "string" ? settings.payeeName.trim() : "";
  if (payeeName) {
    params.set("pn", payeeName);
  }

  if (typeof settings.amount === "number" && Number.isFinite(settings.amount) && settings.amount > 0) {
    params.set("am", settings.amount.toFixed(2));
    params.set("cu", "INR");
  }

  const paymentTitle = typeof settings.paymentTitle === "string" ? settings.paymentTitle.trim() : "";
  if (paymentTitle) {
    params.set("tn", paymentTitle);
  }

  return `upi://pay?${params.toString()}`;
}

export const buildUpiPaymentUrl = buildUpiDeepLink;
