import { z } from "zod";
import type { PublicPaymentSettings } from "../../payment/types/payment.types";
import { buildUpiPaymentUrl, isValidUpiId, normalizeUpiId } from "../../payment/utilities/upi.utils";
import { normalizeOptionalString, parsePaymentFeeInput } from "./payment-settings.utils";

export type UpiPreviewResult =
  | {
      status: "ready";
      uri: string;
    }
  | {
      status: "incomplete";
      message: string;
    }
  | {
      status: "invalid";
      message: string;
    };

type UpiPreviewInput = {
  upiId?: string | null;
  payeeName?: string | null;
  amount?: number | string | null;
  paymentTitle?: string | null;
};

const safePreviewSchema = z.object({
  amount: z.number().positive(),
  payeeName: z.string().min(2),
  paymentTitle: z.string().min(3),
  upiId: z.string().refine(isValidUpiId)
});

function parsePreviewAmount(value: number | string | null | undefined): {
  amount: number | null;
  hasValue: boolean;
  isInvalid: boolean;
} {
  if (typeof value === "number") {
    return {
      amount: Number.isFinite(value) && value > 0 ? value : null,
      hasValue: true,
      isInvalid: !Number.isFinite(value) || value <= 0
    };
  }

  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    return {
      amount: null,
      hasValue: false,
      isInvalid: false
    };
  }

  const amount = parsePaymentFeeInput(trimmedValue);

  return {
    amount,
    hasValue: true,
    isInvalid: amount === null
  };
}

function containsUnsafePlaceholder(value: string): boolean {
  return /\b(?:undefined|null|NaN)\b/i.test(value);
}

export function createSafeUpiPreview(input: UpiPreviewInput): UpiPreviewResult {
  try {
    const upiId = normalizeUpiId(input.upiId);
    const payeeName = normalizeOptionalString(input.payeeName);
    const paymentTitle = normalizeOptionalString(input.paymentTitle);
    const parsedAmount = parsePreviewAmount(input.amount);

    if (!upiId) {
      return {
        message: "UPI लिंक के लिए UPI आईडी दर्ज करें।",
        status: "incomplete"
      };
    }

    if (!isValidUpiId(upiId)) {
      return {
        message: "UPI लिंक के लिए मान्य UPI आईडी आवश्यक है।",
        status: "invalid"
      };
    }

    if (!payeeName) {
      return {
        message: "UPI लिंक के लिए प्राप्तकर्ता का नाम दर्ज करें।",
        status: "incomplete"
      };
    }

    if (!parsedAmount.hasValue) {
      return {
        message: "UPI लिंक के लिए पंजीकरण शुल्क दर्ज करें।",
        status: "incomplete"
      };
    }

    if (parsedAmount.isInvalid || parsedAmount.amount === null) {
      return {
        message: "UPI लिंक के लिए मान्य पंजीकरण शुल्क आवश्यक है।",
        status: "invalid"
      };
    }

    if (!paymentTitle) {
      return {
        message: "UPI लिंक के लिए भुगतान शीर्षक दर्ज करें।",
        status: "incomplete"
      };
    }

    const previewData = {
      amount: parsedAmount.amount,
      payeeName,
      paymentTitle,
      upiId
    };

    if (!safePreviewSchema.safeParse(previewData).success) {
      return {
        message: "UPI लिंक के लिए मान्य भुगतान विवरण आवश्यक हैं।",
        status: "invalid"
      };
    }

    const settings: PublicPaymentSettings = {
      amount: previewData.amount,
      instructions: null,
      payeeName: previewData.payeeName,
      paymentDeadline: null,
      paymentEnabled: true,
      paymentTitle: previewData.paymentTitle,
      publicContact: null,
      qrCodeUrl: null,
      upiId: previewData.upiId
    };
    const uri = buildUpiPaymentUrl(settings);

    if (!uri || containsUnsafePlaceholder(uri)) {
      return {
        message: "UPI लिंक तैयार नहीं हो सका। कृपया भुगतान विवरण जांचें।",
        status: "invalid"
      };
    }

    return {
      status: "ready",
      uri
    };
  } catch {
    return {
      message: "UPI लिंक तैयार नहीं हो सका। कृपया भुगतान विवरण जांचें।",
      status: "invalid"
    };
  }
}
