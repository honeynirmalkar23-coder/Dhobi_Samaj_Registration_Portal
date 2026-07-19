import { z } from "zod";
import { educationLevelOptions } from "../../../config/education-options.config";
import {
  getPhotoValidationError,
  isIntegerString,
  normalizeEducationDetails,
  normalizeFullName,
  normalizePermanentAddress
} from "../utilities/registration-form.utils";

const educationValues = educationLevelOptions.map((option) => option.value) as readonly string[];

function requiredString(message: string) {
  return z.string().transform((value) => value.trim()).refine((value) => value.length > 0, {
    message
  });
}

function countString() {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: "कृपया संख्या दर्ज करें।"
    })
    .refine((value) => isIntegerString(value), {
      message: "कृपया 0 से 99 के बीच पूर्ण संख्या दर्ज करें।"
    })
    .refine((value) => {
      const parsedValue = Number.parseInt(value, 10);
      return parsedValue >= 0 && parsedValue <= 99;
    }, "कृपया 0 से 99 के बीच पूर्ण संख्या दर्ज करें।")
    .transform((value) => Number.parseInt(value, 10));
}

export const registrationFormSchema = z
  .object({
    fullName: z
      .string()
      .transform(normalizeFullName)
      .refine((value) => value.length > 0, "कृपया सदस्य का नाम दर्ज करें।")
      .refine((value) => value.length >= 2, "नाम कम से कम 2 अक्षरों का होना चाहिए।")
      .refine((value) => value.length <= 100, "नाम 100 अक्षरों से अधिक नहीं हो सकता।"),
    age: requiredString("कृपया उम्र दर्ज करें।")
      .refine((value) => isIntegerString(value), "कृपया मान्य उम्र दर्ज करें।")
      .refine((value) => Number.parseInt(value, 10) >= 1, "उम्र कम से कम 1 वर्ष होनी चाहिए।")
      .refine((value) => Number.parseInt(value, 10) <= 120, "उम्र 120 वर्ष से अधिक नहीं हो सकती।")
      .transform((value) => Number.parseInt(value, 10)),
    educationLevel: z
      .string()
      .refine((value) => educationValues.includes(value), "कृपया शिक्षा स्तर चुनें।"),
    educationDetails: z
      .string()
      .transform(normalizeEducationDetails)
      .refine((value) => value.length <= 150, "शिक्षा विवरण 150 अक्षरों से अधिक नहीं हो सकता।")
      .optional()
      .default(""),
    permanentAddress: z
      .string()
      .transform(normalizePermanentAddress)
      .refine((value) => value.length > 0, "कृपया स्थायी पता दर्ज करें।")
      .refine((value) => value.length >= 10, "स्थायी पता कम से कम 10 अक्षरों का होना चाहिए।")
      .refine((value) => value.length <= 500, "स्थायी पता 500 अक्षरों से अधिक नहीं हो सकता।"),
    boysCount: countString(),
    girlsCount: countString(),
    eldersCount: countString(),
    applicantPhoto: z
      .custom<File | null>((value) => value === null || value instanceof File, {
        message: "चयनित फाइल मान्य फोटो नहीं है।"
      })
      .refine((file) => getPhotoValidationError(file) === null, (file) => ({
        message: getPhotoValidationError(file) ?? "चयनित फाइल मान्य फोटो नहीं है।"
      })),
    declarationAccepted: z.literal(true, {
      errorMap: () => ({
        message: "पंजीकरण आगे बढ़ाने के लिए कृपया घोषणा स्वीकार करें।"
      })
    })
  })
  .superRefine((values, context) => {
    if (values.educationLevel === "other" && !values.educationDetails?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "‘अन्य’ शिक्षा स्तर के लिए कृपया शिक्षा का विवरण दर्ज करें।",
        path: ["educationDetails"]
      });
    }
  });

export type RegistrationFormSchemaInput = z.input<typeof registrationFormSchema>;
export type RegistrationFormSchemaOutput = z.output<typeof registrationFormSchema>;
