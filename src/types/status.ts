export type RegistrationStatus =
  | "awaiting_payment"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "archived";

export type PaymentStatus =
  | "not_submitted"
  | "pending_verification"
  | "verified"
  | "rejected";

export type StatusTone =
  | "neutral"
  | "warning"
  | "info"
  | "success"
  | "danger"
  | "muted";

export type StatusDisplayConfig = {
  label: string;
  labelEn: string;
  tone: StatusTone;
  className: string;
};
