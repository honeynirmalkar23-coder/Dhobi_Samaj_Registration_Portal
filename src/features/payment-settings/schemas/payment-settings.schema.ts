import { z } from "zod";
import { isValidUpiId, normalizeUpiId } from "../../payment/utilities/upi.utils";
import { getQrCodeValidationError } from "../utilities/qr-code-file.utils";
import { getPaymentFeeValidationError } from "../utilities/payment-settings.utils";

const requiredMessage = {
  upiId: "ऑनलाइन भुगतान सक्षम करने के लिए UPI आईडी दर्ज करें।",
  payeeName: "कृपया प्राप्तकर्ता का नाम दर्ज करें।",
  registrationFee: "कृपया पंजीकरण शुल्क दर्ज करें।",
  paymentTitle: "कृपया भुगतान शीर्षक दर्ज करें।",
  paymentInstructions: "कृपया भुगतान निर्देश दर्ज करें।",
  publicSupportContact: "कृपया भुगतान सहायता संपर्क दर्ज करें।"
} as const;

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

export const paymentSettingsSchema = z
  .object({
    paymentEnabled: z.boolean(),
    qrCodeFile: z
      .custom<File | null>((value) => value === null || value instanceof File, {
        message: "चयनित फाइल मान्य QR कोड इमेज नहीं है।"
      })
      .nullable(),
    existingQrCodePath: z.string(),
    upiId: z.string(),
    payeeName: z.string(),
    registrationFee: z.string(),
    paymentTitle: z.string(),
    paymentInstructions: z.string(),
    publicSupportContact: z.string(),
    paymentDeadline: z.string()
  })
  .superRefine((values, context) => {
    const isEnabled = values.paymentEnabled;
    const hasExistingQrCode = values.existingQrCodePath.trim().length > 0;
    const qrError = values.qrCodeFile
      ? getQrCodeValidationError(values.qrCodeFile, isEnabled)
      : isEnabled && !hasExistingQrCode
        ? "ऑनलाइन भुगतान सक्षम करने के लिए QR कोड चुनें।"
        : null;

    if (qrError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: qrError,
        path: ["qrCodeFile"]
      });
    }

    const normalizedUpiId = normalizeUpiId(values.upiId);
    if (isEnabled && !hasValue(normalizedUpiId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage.upiId,
        path: ["upiId"]
      });
    } else if (hasValue(normalizedUpiId) && !isValidUpiId(normalizedUpiId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "कृपया मान्य UPI आईडी दर्ज करें।",
        path: ["upiId"]
      });
    }

    const payeeName = values.payeeName.trim();
    if (isEnabled && !payeeName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage.payeeName,
        path: ["payeeName"]
      });
    } else if (payeeName && payeeName.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "प्राप्तकर्ता का नाम कम से कम 2 अक्षरों का होना चाहिए।",
        path: ["payeeName"]
      });
    } else if (payeeName.length > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "प्राप्तकर्ता का नाम 100 अक्षरों से अधिक नहीं हो सकता।",
        path: ["payeeName"]
      });
    }

    const feeError = values.registrationFee.trim()
      ? getPaymentFeeValidationError(values.registrationFee)
      : isEnabled
        ? requiredMessage.registrationFee
        : null;
    if (feeError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: feeError,
        path: ["registrationFee"]
      });
    }

    const paymentTitle = values.paymentTitle.trim();
    if (isEnabled && !paymentTitle) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage.paymentTitle,
        path: ["paymentTitle"]
      });
    } else if (paymentTitle && paymentTitle.length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "भुगतान शीर्षक कम से कम 3 अक्षरों का होना चाहिए।",
        path: ["paymentTitle"]
      });
    } else if (paymentTitle.length > 120) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "भुगतान शीर्षक 120 अक्षरों से अधिक नहीं हो सकता।",
        path: ["paymentTitle"]
      });
    }

    const paymentInstructions = values.paymentInstructions.trim();
    if (isEnabled && !paymentInstructions) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage.paymentInstructions,
        path: ["paymentInstructions"]
      });
    } else if (paymentInstructions && paymentInstructions.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "भुगतान निर्देश कम से कम 10 अक्षरों के होने चाहिए।",
        path: ["paymentInstructions"]
      });
    } else if (paymentInstructions.length > 1000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "भुगतान निर्देश 1000 अक्षरों से अधिक नहीं हो सकते।",
        path: ["paymentInstructions"]
      });
    }

    const publicSupportContact = values.publicSupportContact.trim();
    if (isEnabled && !publicSupportContact) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage.publicSupportContact,
        path: ["publicSupportContact"]
      });
    } else if (publicSupportContact && publicSupportContact.length < 5) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "सहायता संपर्क कम से कम 5 अक्षरों का होना चाहिए।",
        path: ["publicSupportContact"]
      });
    } else if (publicSupportContact.length > 150) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "सहायता संपर्क 150 अक्षरों से अधिक नहीं हो सकता।",
        path: ["publicSupportContact"]
      });
    }

    const deadline = values.paymentDeadline.trim();
    if (deadline) {
      const deadlineDate = new Date(deadline);

      if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "कृपया भविष्य की मान्य तारीख और समय चुनें।",
          path: ["paymentDeadline"]
        });
      }
    }
  });

export type PaymentSettingsSchemaInput = z.input<typeof paymentSettingsSchema>;
export type PaymentSettingsSchemaOutput = z.output<typeof paymentSettingsSchema>;
