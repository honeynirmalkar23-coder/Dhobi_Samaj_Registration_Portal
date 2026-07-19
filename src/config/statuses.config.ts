import type {
  PaymentStatus,
  RegistrationStatus,
  StatusDisplayConfig,
  StatusTone
} from "../types/status";

export const statusToneClasses = {
  neutral:
    "border-brown-700/20 bg-cream-100 text-brown-800",
  warning:
    "border-saffron-500/30 bg-saffron-50 text-brown-800",
  info:
    "border-maroon-700/20 bg-maroon-50 text-maroon-800",
  success:
    "border-communityGreen-600/25 bg-communityGreen-50 text-communityGreen-700",
  danger:
    "border-maroon-700/25 bg-maroon-100 text-maroon-800",
  muted:
    "border-brown-700/15 bg-white text-brown-700"
} as const satisfies Record<StatusTone, string>;

export const registrationStatusConfig = {
  awaiting_payment: {
    label: "भुगतान की प्रतीक्षा",
    labelEn: "Awaiting payment",
    tone: "warning",
    className: statusToneClasses.warning
  },
  submitted: {
    label: "जमा किया गया",
    labelEn: "Submitted",
    tone: "info",
    className: statusToneClasses.info
  },
  under_review: {
    label: "समीक्षा में",
    labelEn: "Under review",
    tone: "neutral",
    className: statusToneClasses.neutral
  },
  approved: {
    label: "स्वीकृत",
    labelEn: "Approved",
    tone: "success",
    className: statusToneClasses.success
  },
  rejected: {
    label: "अस्वीकृत",
    labelEn: "Rejected",
    tone: "danger",
    className: statusToneClasses.danger
  },
  archived: {
    label: "संग्रहित",
    labelEn: "Archived",
    tone: "muted",
    className: statusToneClasses.muted
  }
} as const satisfies Record<RegistrationStatus, StatusDisplayConfig>;

export const paymentStatusConfig = {
  not_submitted: {
    label: "भुगतान प्रमाण जमा नहीं",
    labelEn: "Payment proof not submitted",
    tone: "muted",
    className: statusToneClasses.muted
  },
  pending_verification: {
    label: "सत्यापन लंबित",
    labelEn: "Pending verification",
    tone: "warning",
    className: statusToneClasses.warning
  },
  verified: {
    label: "भुगतान सत्यापित",
    labelEn: "Payment verified",
    tone: "success",
    className: statusToneClasses.success
  },
  rejected: {
    label: "भुगतान प्रमाण अस्वीकृत",
    labelEn: "Payment proof rejected",
    tone: "danger",
    className: statusToneClasses.danger
  }
} as const satisfies Record<PaymentStatus, StatusDisplayConfig>;
