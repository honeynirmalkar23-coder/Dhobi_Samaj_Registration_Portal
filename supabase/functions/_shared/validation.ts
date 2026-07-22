import { ApiError } from "./errors.ts";

const registrationIdPattern = /^DS-\d{4}-\d{6}$/;
const upiIdPattern = /^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/;

export function normalizeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function normalizeOptionalString(value: FormDataEntryValue | null): string | null {
  const normalizedValue = normalizeString(value);

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeMobileNumber(value: FormDataEntryValue | null): string {
  return normalizeString(value).replace(/[\s-]+/g, "");
}

export function normalizeRegistrationId(value: unknown): string {
  if (typeof value !== "string") {
    throw new ApiError("INVALID_REGISTRATION_ID", 400);
  }

  return value.trim().toUpperCase();
}

export function assertRegistrationId(value: unknown): string {
  const registrationId = normalizeRegistrationId(value);

  if (!registrationIdPattern.test(registrationId)) {
    throw new ApiError("INVALID_REGISTRATION_ID", 400);
  }

  return registrationId;
}

export function parseIntegerField(value: FormDataEntryValue | null, fieldName: string): number {
  const normalizedValue = normalizeString(value);

  if (!/^\d+$/.test(normalizedValue)) {
    throw new ApiError("VALIDATION_ERROR", 400, `${fieldName} मान्य संख्या नहीं है।`);
  }

  return Number.parseInt(normalizedValue, 10);
}

export function assertRange(value: number, min: number, max: number, message: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ApiError("VALIDATION_ERROR", 400, message);
  }
}

export function assertStringLength(
  value: string,
  min: number,
  max: number,
  message: string
): void {
  if (value.length < min || value.length > max) {
    throw new ApiError("VALIDATION_ERROR", 400, message);
  }
}

export function assertUpiId(value: string | null): void {
  if (!value || !upiIdPattern.test(value.trim())) {
    throw new ApiError("VALIDATION_ERROR", 400, "कृपया मान्य UPI आईडी दर्ज करें।");
  }
}

export function parseRegistrationForm(formData: FormData) {
  const fullName = normalizeString(formData.get("fullName"));
  const age = parseIntegerField(formData.get("age"), "उम्र");
  const mobileNumber = normalizeMobileNumber(formData.get("mobileNumber"));
  const educationLevel = normalizeString(formData.get("educationLevel"));
  const educationDetails = normalizeOptionalString(formData.get("educationDetails"));
  const permanentAddress = normalizeString(formData.get("permanentAddress"));
  const boysCount = parseIntegerField(formData.get("boysCount"), "लड़कों की संख्या");
  const girlsCount = parseIntegerField(formData.get("girlsCount"), "लड़कियों की संख्या");
  const eldersCount = parseIntegerField(formData.get("eldersCount"), "बुजुर्गों की संख्या");
  const declarationAccepted = normalizeString(formData.get("declarationAccepted"));

  assertStringLength(fullName, 2, 100, "नाम 2 से 100 अक्षरों के बीच होना चाहिए।");
  assertRange(age, 1, 120, "उम्र 1 से 120 वर्ष के बीच होनी चाहिए।");
  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    throw new ApiError("VALIDATION_ERROR", 400, "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।");
  }
  assertStringLength(educationLevel, 1, 80, "कृपया शिक्षा स्तर चुनें।");
  if (educationDetails && educationDetails.length > 150) {
    throw new ApiError("VALIDATION_ERROR", 400, "शिक्षा विवरण 150 अक्षरों से अधिक नहीं हो सकता।");
  }
  if (educationLevel === "other" && !educationDetails) {
    throw new ApiError("VALIDATION_ERROR", 400, "‘अन्य’ शिक्षा स्तर के लिए कृपया शिक्षा का विवरण दर्ज करें।");
  }
  assertStringLength(permanentAddress, 10, 500, "स्थायी पता 10 से 500 अक्षरों के बीच होना चाहिए।");
  assertRange(boysCount, 0, 99, "लड़कों की संख्या 0 से 99 के बीच होनी चाहिए।");
  assertRange(girlsCount, 0, 99, "लड़कियों की संख्या 0 से 99 के बीच होनी चाहिए।");
  assertRange(eldersCount, 0, 99, "बुजुर्गों की संख्या 0 से 99 के बीच होनी चाहिए।");

  if (declarationAccepted !== "true") {
    throw new ApiError("VALIDATION_ERROR", 400, "पंजीकरण आगे बढ़ाने के लिए घोषणा स्वीकार करें।");
  }

  return {
    fullName,
    age,
    mobileNumber,
    educationLevel,
    educationDetails,
    permanentAddress,
    boysCount,
    girlsCount,
    eldersCount
  };
}
