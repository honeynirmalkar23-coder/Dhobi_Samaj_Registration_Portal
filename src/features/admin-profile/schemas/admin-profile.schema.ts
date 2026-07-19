import { z } from "zod";

export const adminProfileSchema = z
  .object({
    confirmNewPassword: z
      .string()
      .max(128, "नया पासवर्ड मान्य नहीं है।"),
    currentPassword: z
      .string()
      .min(1, "कृपया वर्तमान पासवर्ड दर्ज करें।")
      .max(512, "कृपया वर्तमान पासवर्ड दर्ज करें।"),
    displayName: z
      .string()
      .trim()
      .min(2, "कृपया प्रशासन नाम दर्ज करें।")
      .max(80, "प्रशासन नाम 80 अक्षरों से कम होना चाहिए।"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "कृपया ईमेल पता दर्ज करें।")
      .max(254, "कृपया मान्य ईमेल पता दर्ज करें।")
      .email("कृपया मान्य ईमेल पता दर्ज करें।"),
    newPassword: z
      .string()
      .max(128, "नया पासवर्ड मान्य नहीं है।")
  })
  .superRefine((values, context) => {
    if (values.newPassword && values.newPassword.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "नया पासवर्ड कम से कम 10 अक्षरों का होना चाहिए।",
        path: ["newPassword"]
      });
    }

    if (values.newPassword && values.newPassword !== values.confirmNewPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "नया पासवर्ड और पुष्टि पासवर्ड समान होना चाहिए।",
        path: ["confirmNewPassword"]
      });
    }
  });

export type AdminProfileFormValues = z.input<typeof adminProfileSchema>;
export type AdminProfileSubmitValues = z.output<typeof adminProfileSchema>;
