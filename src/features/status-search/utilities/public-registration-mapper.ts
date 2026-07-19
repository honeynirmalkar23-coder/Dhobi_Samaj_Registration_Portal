import type { PublicRegistrationStatus } from "../types/status-search.types";

export function toPublicRegistrationStatus(
  status: PublicRegistrationStatus
): PublicRegistrationStatus {
  return {
    registrationId: status.registrationId,
    maskedName: status.maskedName,
    registrationCreatedAt: status.registrationCreatedAt,
    registrationStatus: status.registrationStatus,
    paymentStatus: status.paymentStatus,
    lastUpdatedAt: status.lastUpdatedAt,
    paymentResubmissionAllowed: status.paymentResubmissionAllowed,
    publicRejectionMessage: status.publicRejectionMessage
  };
}
