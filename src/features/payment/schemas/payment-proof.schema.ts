import { z } from "zod";
import { getPaymentProofValidationError } from "../utilities/payment-file.utils";

export const paymentProofSchema = z.object({
  paymentScreenshot: z
    .custom<File | null>((value) => value === null || value instanceof File, {
      message: "चयनित फाइल मान्य स्क्रीनशॉट नहीं है।"
    })
    .refine((file) => getPaymentProofValidationError(file) === null, (file) => ({
      message: getPaymentProofValidationError(file) ?? "चयनित फाइल मान्य स्क्रीनशॉट नहीं है।"
    })),
  declarationAccepted: z.literal(true, {
    errorMap: () => ({
      message: "भुगतान प्रमाण आगे बढ़ाने के लिए कृपया घोषणा स्वीकार करें।"
    })
  })
});

export type PaymentProofSchemaInput = z.input<typeof paymentProofSchema>;
export type PaymentProofSchemaOutput = z.output<typeof paymentProofSchema>;
