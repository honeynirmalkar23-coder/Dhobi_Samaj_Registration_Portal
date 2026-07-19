export const fileUploadLimits = {
  memberPhoto: {
    label: "सदस्य फोटो",
    maxSizeMb: 5,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  },
  paymentProof: {
    label: "भुगतान प्रमाण",
    maxSizeMb: 5,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  },
  paymentQr: {
    label: "भुगतान QR कोड",
    maxSizeMb: 3,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  }
} as const;
