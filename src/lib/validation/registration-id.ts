const REGISTRATION_ID_PATTERN = /^DS-\d{4}-\d{6}$/;

export const registrationIdFormat = "DS-YYYY-000001";

export function normalizeRegistrationId(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidRegistrationId(value: string): boolean {
  return REGISTRATION_ID_PATTERN.test(normalizeRegistrationId(value));
}

export function getRegistrationIdValidationError(value: string): string | null {
  if (isValidRegistrationId(value)) {
    return null;
  }

  return "कृपया DS-YYYY-000001 प्रारूप में मान्य पंजीकरण आईडी दर्ज करें।";
}
