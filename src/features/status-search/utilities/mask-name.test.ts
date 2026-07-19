import { describe, expect, it } from "vitest";
import { maskApplicantName } from "./mask-name";

describe("maskApplicantName", () => {
  it("masks English names without returning the complete name", () => {
    const maskedName = maskApplicantName("Yogesh Kumar Bandhe");

    expect(maskedName).not.toBe("Yogesh Kumar Bandhe");
    expect(maskedName).toBe("Yo**** Ku*** Ba****");
  });

  it("masks Hindi names with Unicode-safe iteration", () => {
    const maskedName = maskApplicantName("योगेश कुमार बांधे");

    expect(maskedName).not.toBe("योगेश कुमार बांधे");
    expect(maskedName).toContain("यो");
    expect(maskedName).toContain("कु");
    expect(maskedName).toContain("बा");
  });

  it("handles short and empty names safely", () => {
    expect(maskApplicantName("क अजय")).toBe("* अज**");
    expect(maskApplicantName("AB")).toBe("A*");
    expect(maskApplicantName("")).toBe("नाम उपलब्ध नहीं");
  });
});
