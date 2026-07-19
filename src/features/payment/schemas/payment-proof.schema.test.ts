import { describe, expect, it } from "vitest";
import { paymentProofSchema } from "./payment-proof.schema";

function createPaymentScreenshot(
  name = "payment-proof.png",
  type = "image/png",
  content: BlobPart[] = ["proof"]
) {
  return new File(content, name, { type });
}

describe("paymentProofSchema", () => {
  it("accepts a valid screenshot and declaration", () => {
    const result = paymentProofSchema.safeParse({
      paymentScreenshot: createPaymentScreenshot(),
      declarationAccepted: true
    });

    expect(result.success).toBe(true);
  });

  it("requires a payment screenshot", () => {
    const result = paymentProofSchema.safeParse({
      paymentScreenshot: null,
      declarationAccepted: true
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("कृपया भुगतान स्क्रीनशॉट चुनें।");
  });

  it("rejects unsupported screenshot file types", () => {
    const result = paymentProofSchema.safeParse({
      paymentScreenshot: createPaymentScreenshot("payment-proof.pdf", "application/pdf"),
      declarationAccepted: true
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "केवल JPG, JPEG, PNG या WebP स्क्रीनशॉट स्वीकार किए जाते हैं।"
    );
  });

  it("rejects oversized screenshots", () => {
    const result = paymentProofSchema.safeParse({
      paymentScreenshot: createPaymentScreenshot("payment-proof.jpg", "image/jpeg", [
        new Uint8Array(6 * 1024 * 1024)
      ]),
      declarationAccepted: true
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "स्क्रीनशॉट का आकार 5 MB से अधिक नहीं होना चाहिए।"
    );
  });

  it("requires the declaration", () => {
    const result = paymentProofSchema.safeParse({
      paymentScreenshot: createPaymentScreenshot(),
      declarationAccepted: false
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "भुगतान प्रमाण आगे बढ़ाने के लिए कृपया घोषणा स्वीकार करें।"
    );
  });
});
