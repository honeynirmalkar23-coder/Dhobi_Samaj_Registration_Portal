import type { PaymentStatus, RegistrationStatus } from "../../../types/status";

export type StatusSearchViewState =
  | "idle"
  | "invalid"
  | "backend_unavailable"
  | "loading"
  | "not_found"
  | "found"
  | "error";

export type PublicRegistrationStatus = {
  registrationId: string;
  maskedName: string;
  registrationCreatedAt: string;
  registrationStatus: RegistrationStatus;
  paymentStatus: PaymentStatus;
  lastUpdatedAt: string;
  paymentResubmissionAllowed: boolean;
  publicRejectionMessage: string | null;
};

export type StatusSearchFormValues = {
  registrationId: string;
};

export type ResubmissionAvailabilityState =
  | "not_allowed"
  | "allowed"
  | "already_submitted"
  | "backend_unavailable";
