import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "कृपया ईमेल पता दर्ज करें।")
    .max(254, "कृपया मान्य ईमेल पता दर्ज करें।")
    .email("कृपया मान्य ईमेल पता दर्ज करें।"),
  password: z
    .string()
    .min(1, "कृपया पासवर्ड दर्ज करें।")
    .max(512, "कृपया पासवर्ड दर्ज करें।")
});

export type AdminLoginFormValues = z.input<typeof adminLoginSchema>;
export type AdminLoginSubmitValues = z.output<typeof adminLoginSchema>;
