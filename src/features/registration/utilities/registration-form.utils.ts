import type { KeyboardEvent } from "react";
import { educationLevelOptions } from "../../../config/education-options.config";
import { fileUploadLimits } from "../../../config/file-upload.config";
import type {
  RegistrationFormFieldName,
  RegistrationFormInputValues,
  RequiredProgress
} from "../types/registration-form.types";

export const registrationFormDefaults: RegistrationFormInputValues = {
  fullName: "",
  age: "",
  mobileNumber: "",
  educationLevel: "",
  educationDetails: "",
  permanentAddress: "",
  boysCount: "0",
  girlsCount: "0",
  eldersCount: "0",
  applicantPhoto: null,
  declarationAccepted: false
};

export const registrationFieldLabels = {
  fullName: "नाम",
  age: "उम्र",
  mobileNumber: "मोबाइल नंबर",
  educationLevel: "शिक्षा स्तर",
  educationDetails: "कक्षा / डिग्री / विषय",
  permanentAddress: "स्थायी पता",
  boysCount: "लड़कों की संख्या",
  girlsCount: "लड़कियों की संख्या",
  eldersCount: "बुजुर्गों की संख्या",
  applicantPhoto: "फोटो अपलोड करें",
  declarationAccepted: "घोषणा"
} as const satisfies Record<RegistrationFormFieldName, string>;

export const registrationFieldIds = {
  fullName: "registration-full-name",
  age: "registration-age",
  mobileNumber: "registration-mobile-number",
  educationLevel: "registration-education-level",
  educationDetails: "registration-education-details",
  permanentAddress: "registration-permanent-address",
  boysCount: "registration-boys-count",
  girlsCount: "registration-girls-count",
  eldersCount: "registration-elders-count",
  applicantPhoto: "registration-applicant-photo",
  declarationAccepted: "registration-declaration"
} as const satisfies Record<RegistrationFormFieldName, string>;

const integerPattern = /^\d+$/;
const mobileNumberPattern = /^[6-9]\d{9}$/;

export function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeMobileNumber(value: string): string {
  return value.trim().replace(/[\s-]+/g, "");
}

export function normalizeEducationDetails(value: string): string {
  return value.trim();
}

export function normalizePermanentAddress(value: string): string {
  return value.trim();
}

export function isIntegerString(value: string): boolean {
  return integerPattern.test(value);
}

export function parseIntegerField(value: string): number | null {
  if (!isIntegerString(value)) {
    return null;
  }

  return Number.parseInt(value, 10);
}

export function isValidAgeValue(value: string): boolean {
  const parsedValue = parseIntegerField(value.trim());

  return parsedValue !== null && parsedValue >= 1 && parsedValue <= 120;
}

export function isValidFamilyCountValue(value: string): boolean {
  const parsedValue = parseIntegerField(value.trim());

  return parsedValue !== null && parsedValue >= 0 && parsedValue <= 99;
}

export function isValidMobileNumber(value: string): boolean {
  return mobileNumberPattern.test(normalizeMobileNumber(value));
}

export function getFamilyCountTotal(values: Pick<
  RegistrationFormInputValues,
  "boysCount" | "girlsCount" | "eldersCount"
>): number {
  const counts = [values.boysCount, values.girlsCount, values.eldersCount].map((value) => {
    const parsedValue = parseIntegerField(String(value).trim());
    return parsedValue ?? 0;
  });

  return counts.reduce((total, count) => total + count, 0);
}

export function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAcceptedPhotoMimeType(type: string): boolean {
  return fileUploadLimits.memberPhoto.allowedMimeTypes.includes(
    type as (typeof fileUploadLimits.memberPhoto.allowedMimeTypes)[number]
  );
}

export function isAcceptedPhotoExtension(fileName: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(fileName);
}

export function getPhotoValidationError(file: File | null): string | null {
  if (!file) {
    return "कृपया सदस्य का फोटो चुनें।";
  }

  if (!isAcceptedPhotoMimeType(file.type) || !isAcceptedPhotoExtension(file.name)) {
    return "केवल JPG, JPEG, PNG या WebP फोटो स्वीकार किए जाते हैं।";
  }

  if (file.size > fileUploadLimits.memberPhoto.maxSizeMb * 1024 * 1024) {
    return "फोटो का आकार 5 MB से अधिक नहीं होना चाहिए।";
  }

  if (file.size <= 0) {
    return "चयनित फाइल मान्य फोटो नहीं है।";
  }

  return null;
}

export function getEducationLabel(
  value: RegistrationFormInputValues["educationLevel"],
  language: "hi" | "en" = "hi"
): string {
  const option = educationLevelOptions.find((educationOption) => educationOption.value === value);

  if (!option) {
    return "";
  }

  return language === "en" ? option.labelEn : option.label;
}

export function getRequiredProgress(values: RegistrationFormInputValues): RequiredProgress {
  const requiresEducationDetails = values.educationLevel === "other";
  const requiredChecks = [
    normalizeFullName(values.fullName).length >= 2 &&
      normalizeFullName(values.fullName).length <= 100,
    isValidAgeValue(values.age),
    isValidMobileNumber(values.mobileNumber),
    values.educationLevel !== "",
    !requiresEducationDetails || normalizeEducationDetails(values.educationDetails).length > 0,
    normalizePermanentAddress(values.permanentAddress).length >= 10 &&
      normalizePermanentAddress(values.permanentAddress).length <= 500,
    isValidFamilyCountValue(values.boysCount),
    isValidFamilyCountValue(values.girlsCount),
    isValidFamilyCountValue(values.eldersCount),
    getPhotoValidationError(values.applicantPhoto) === null,
    values.declarationAccepted
  ];

  return {
    completed: requiredChecks.filter(Boolean).length,
    total: requiredChecks.length
  };
}

export function blockInvalidNumberKey(event: KeyboardEvent<HTMLInputElement>): void {
  if (["e", "E", "+", "-", "."].includes(event.key)) {
    event.preventDefault();
  }
}
