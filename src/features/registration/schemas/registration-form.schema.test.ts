import { describe, expect, it } from "vitest";
import { registrationFormSchema } from "./registration-form.schema";
import type { RegistrationFormInputValues } from "../types/registration-form.types";

function validPhoto() {
  return new File(["photo"], "member-photo.jpg", {
    type: "image/jpeg"
  });
}

function validValues(overrides: Partial<RegistrationFormInputValues> = {}) {
  return {
    fullName: "राम कुमार",
    age: "35",
    educationLevel: "graduate",
    educationDetails: "बी.ए.",
    permanentAddress: "ग्राम उदाहरण, जिला उदाहरण, राज्य",
    boysCount: "2",
    girlsCount: "3",
    eldersCount: "1",
    applicantPhoto: validPhoto(),
    declarationAccepted: true,
    ...overrides
  };
}

function messagesFor(overrides: Partial<RegistrationFormInputValues>) {
  const result = registrationFormSchema.safeParse(validValues(overrides));

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => issue.message);
}

describe("registrationFormSchema", () => {
  it("accepts a valid complete form", () => {
    const result = registrationFormSchema.safeParse(validValues());

    expect(result.success).toBe(true);
  });

  it("requires full name", () => {
    expect(messagesFor({ fullName: "   " })).toContain("कृपया सदस्य का नाम दर्ज करें।");
  });

  it.each([
    ["", "कृपया उम्र दर्ज करें।"],
    ["0", "उम्र कम से कम 1 वर्ष होनी चाहिए।"],
    ["121", "उम्र 120 वर्ष से अधिक नहीं हो सकती।"],
    ["20.5", "कृपया मान्य उम्र दर्ज करें।"]
  ])("validates age value %s", (age, message) => {
    expect(messagesFor({ age })).toContain(message);
  });

  it("requires education level", () => {
    expect(messagesFor({ educationLevel: "" })).toContain("कृपया शिक्षा स्तर चुनें।");
  });

  it("requires details when education level is other", () => {
    expect(messagesFor({ educationLevel: "other", educationDetails: " " })).toContain(
      "‘अन्य’ शिक्षा स्तर के लिए कृपया शिक्षा का विवरण दर्ज करें।"
    );
  });

  it.each([
    ["", "कृपया स्थायी पता दर्ज करें।"],
    ["छोटा", "स्थायी पता कम से कम 10 अक्षरों का होना चाहिए।"],
    ["अ".repeat(501), "स्थायी पता 500 अक्षरों से अधिक नहीं हो सकता।"]
  ])("validates permanent address", (permanentAddress, message) => {
    expect(messagesFor({ permanentAddress })).toContain(message);
  });

  it.each([
    [{ boysCount: "-1" }, "कृपया 0 से 99 के बीच पूर्ण संख्या दर्ज करें।"],
    [{ girlsCount: "100" }, "कृपया 0 से 99 के बीच पूर्ण संख्या दर्ज करें।"],
    [{ eldersCount: "1.5" }, "कृपया 0 से 99 के बीच पूर्ण संख्या दर्ज करें।"]
  ])("validates family count values", (override, message) => {
    expect(messagesFor(override)).toContain(message);
  });

  it("requires applicant photo", () => {
    expect(messagesFor({ applicantPhoto: null })).toContain("कृपया सदस्य का फोटो चुनें।");
  });

  it("rejects invalid photo type", () => {
    const pdf = new File(["pdf"], "document.pdf", {
      type: "application/pdf"
    });

    expect(messagesFor({ applicantPhoto: pdf })).toContain(
      "केवल JPG, JPEG, PNG या WebP फोटो स्वीकार किए जाते हैं।"
    );
  });

  it("rejects oversized photo", () => {
    const largePhoto = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large-photo.jpg", {
      type: "image/jpeg"
    });

    expect(messagesFor({ applicantPhoto: largePhoto })).toContain(
      "फोटो का आकार 5 MB से अधिक नहीं होना चाहिए।"
    );
  });

  it("requires declaration", () => {
    expect(messagesFor({ declarationAccepted: false })).toContain(
      "पंजीकरण आगे बढ़ाने के लिए कृपया घोषणा स्वीकार करें।"
    );
  });
});
