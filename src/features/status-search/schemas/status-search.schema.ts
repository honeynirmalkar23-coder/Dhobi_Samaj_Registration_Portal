import { z } from "zod";
import {
  getRegistrationIdValidationError,
  normalizeRegistrationId
} from "../../../lib/validation/registration-id";

export const statusSearchSchema = z.object({
  registrationId: z
    .string()
    .transform((value) => normalizeRegistrationId(value))
    .pipe(
      z
        .string()
        .min(1, "कृपया पंजीकरण आईडी दर्ज करें।")
        .refine((value) => getRegistrationIdValidationError(value) === null, {
          message: "कृपया DS-YYYY-000001 प्रारूप में मान्य पंजीकरण आईडी दर्ज करें।"
        })
    )
});

export type StatusSearchSchemaInput = z.input<typeof statusSearchSchema>;
export type StatusSearchSchemaOutput = z.output<typeof statusSearchSchema>;
