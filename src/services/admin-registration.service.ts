import type { PaymentStatus, RegistrationStatus } from "../types/status";
import { getSupabaseClient } from "../lib/supabase/client";
import type { Json } from "../lib/supabase/database.types";
import type { ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";
import { createPrivateSignedUrl } from "./storage.service";
import { dataBackendMode } from "./backend/backend-mode";

export type AdminPaymentProof = {
  id: string;
  storagePath: string;
  signedUrl: string | null;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  proofStatus: "pending_verification" | "verified" | "rejected";
  publicRejectionMessage: string | null;
  reviewedAt: string | null;
  submittedAt: string;
};

export type AdminRegistrationDetails = {
  registrationId: string;
  fullName: string;
  age: number;
  mobileNumber: string | null;
  educationLevel: string;
  educationDetails: string | null;
  permanentAddress: string;
  boysCount: number;
  girlsCount: number;
  eldersCount: number;
  totalFamilyMembers: number;
  registrationStatus: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentResubmissionAllowed: boolean;
  publicRejectionMessage: string | null;
  adminNotes: string | null;
  applicantPhotoPath: string;
  applicantPhotoSignedUrl: string | null;
  paymentSubmittedAt: string | null;
  paymentVerifiedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  paymentProofs: AdminPaymentProof[];
};

function isObject(value: Json | null): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function hydrateSignedUrls(details: AdminRegistrationDetails): Promise<AdminRegistrationDetails> {
  const applicantPhotoUrl = await createPrivateSignedUrl(
    "applicant-photos",
    details.applicantPhotoPath
  );
  const paymentProofs = await Promise.all(
    details.paymentProofs.map(async (proof) => {
      const signedUrl = await createPrivateSignedUrl("payment-proofs", proof.storagePath);

      return {
        ...proof,
        signedUrl: signedUrl.ok ? signedUrl.data : null
      };
    })
  );

  return {
    ...details,
    applicantPhotoSignedUrl: applicantPhotoUrl.ok ? applicantPhotoUrl.data : null,
    paymentProofs
  };
}

function mapDetails(value: Json | null): AdminRegistrationDetails | null {
  if (!isObject(value)) {
    return null;
  }

  return {
    registrationId: String(value.registrationId ?? ""),
    fullName: String(value.fullName ?? ""),
    age: Number(value.age ?? 0),
    mobileNumber: value.mobileNumber === null ? null : String(value.mobileNumber ?? ""),
    educationLevel: String(value.educationLevel ?? ""),
    educationDetails: value.educationDetails === null ? null : String(value.educationDetails ?? ""),
    permanentAddress: String(value.permanentAddress ?? ""),
    boysCount: Number(value.boysCount ?? 0),
    girlsCount: Number(value.girlsCount ?? 0),
    eldersCount: Number(value.eldersCount ?? 0),
    totalFamilyMembers: Number(value.totalFamilyMembers ?? 0),
    registrationStatus: value.registrationStatus as RegistrationStatus,
    paymentStatus: value.paymentStatus as PaymentStatus,
    paymentResubmissionAllowed: Boolean(value.paymentResubmissionAllowed),
    publicRejectionMessage:
      value.publicRejectionMessage === null ? null : String(value.publicRejectionMessage ?? ""),
    adminNotes: value.adminNotes === null ? null : String(value.adminNotes ?? ""),
    applicantPhotoPath: String(value.applicantPhotoPath ?? ""),
    applicantPhotoSignedUrl: null,
    paymentSubmittedAt: value.paymentSubmittedAt === null ? null : String(value.paymentSubmittedAt ?? ""),
    paymentVerifiedAt: value.paymentVerifiedAt === null ? null : String(value.paymentVerifiedAt ?? ""),
    reviewedAt: value.reviewedAt === null ? null : String(value.reviewedAt ?? ""),
    approvedAt: value.approvedAt === null ? null : String(value.approvedAt ?? ""),
    rejectedAt: value.rejectedAt === null ? null : String(value.rejectedAt ?? ""),
    archivedAt: value.archivedAt === null ? null : String(value.archivedAt ?? ""),
    createdAt: String(value.createdAt ?? ""),
    updatedAt: String(value.updatedAt ?? ""),
    version: Number(value.version ?? 0),
    paymentProofs: Array.isArray(value.paymentProofs)
      ? value.paymentProofs.filter(isObject).map((proof) => ({
          id: String(proof.id ?? ""),
          storagePath: String(proof.storagePath ?? ""),
          signedUrl: null,
          originalFilename:
            proof.originalFilename === null ? null : String(proof.originalFilename ?? ""),
          mimeType: String(proof.mimeType ?? ""),
          sizeBytes: Number(proof.sizeBytes ?? 0),
          proofStatus: proof.proofStatus as AdminPaymentProof["proofStatus"],
          publicRejectionMessage:
            proof.publicRejectionMessage === null ? null : String(proof.publicRejectionMessage ?? ""),
          reviewedAt: proof.reviewedAt === null ? null : String(proof.reviewedAt ?? ""),
          submittedAt: String(proof.submittedAt ?? "")
        }))
      : []
  };
}

export async function loadAdminRegistrationDetails(
  registrationId: string
): Promise<ServiceResult<AdminRegistrationDetails | null>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { loadLocalAdminRegistrationDetails } = await import("./backend/local-portal.client");

    return loadLocalAdminRegistrationDetails(registrationId);
  }

  return loadSupabaseAdminRegistrationDetails(registrationId);
}

async function loadSupabaseAdminRegistrationDetails(
  registrationId: string
): Promise<ServiceResult<AdminRegistrationDetails | null>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase.rpc("admin_get_registration_details", {
    p_registration_id: registrationId
  });

  if (error) {
    return serviceFailure("DETAILS_FAILED", "पंजीकरण विवरण प्राप्त नहीं हो सका।");
  }

  const details = mapDetails(data);

  if (!details) {
    return serviceSuccess(null);
  }

  return serviceSuccess(await hydrateSignedUrls(details));
}

export async function runAdminRegistrationAction(params: {
  registrationId: string;
  expectedVersion: number;
  action:
    | "mark_under_review"
    | "verify_payment"
    | "reject_payment"
    | "approve_registration"
    | "reject_registration"
    | "archive_registration"
    | "enable_payment_resubmission";
  publicMessage?: string | null;
}): Promise<ServiceResult<AdminRegistrationDetails>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { runLocalAdminRegistrationAction } = await import("./backend/local-portal.client");

    return runLocalAdminRegistrationAction(params);
  }

  return runSupabaseAdminRegistrationAction(params);
}

async function runSupabaseAdminRegistrationAction(params: {
  registrationId: string;
  expectedVersion: number;
  action:
    | "mark_under_review"
    | "verify_payment"
    | "reject_payment"
    | "approve_registration"
    | "reject_registration"
    | "archive_registration"
    | "enable_payment_resubmission";
  publicMessage?: string | null;
}): Promise<ServiceResult<AdminRegistrationDetails>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase.rpc("admin_update_registration_state", {
    p_registration_id: params.registrationId,
    p_expected_version: params.expectedVersion,
    p_action: params.action,
    p_public_message: params.publicMessage ?? null
  });

  if (error) {
    return serviceFailure(
      error.code === "40001" ? "CONFLICT" : "ACTION_FAILED",
      error.code === "40001"
        ? "यह रिकॉर्ड किसी अन्य प्रशासनिक कार्रवाई से बदल चुका है। कृपया नवीनतम जानकारी पुनः लोड करें।"
        : "प्रशासनिक कार्रवाई पूरी नहीं हो सकी।"
    );
  }

  const details = mapDetails(data);

  if (!details) {
    return serviceFailure("ACTION_FAILED", "अपडेट के बाद रिकॉर्ड प्राप्त नहीं हो सका।");
  }

  return serviceSuccess(await hydrateSignedUrls(details));
}

export async function updateAdminNotes(params: {
  registrationId: string;
  expectedVersion: number;
  adminNotes: string;
}): Promise<ServiceResult<AdminRegistrationDetails>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { updateLocalAdminNotes } = await import("./backend/local-portal.client");

    return updateLocalAdminNotes(params);
  }

  return updateSupabaseAdminNotes(params);
}

async function updateSupabaseAdminNotes(params: {
  registrationId: string;
  expectedVersion: number;
  adminNotes: string;
}): Promise<ServiceResult<AdminRegistrationDetails>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase.rpc("admin_update_notes", {
    p_registration_id: params.registrationId,
    p_expected_version: params.expectedVersion,
    p_admin_notes: params.adminNotes
  });

  if (error) {
    return serviceFailure(
      error.code === "40001" ? "CONFLICT" : "NOTES_FAILED",
      error.code === "40001"
        ? "यह रिकॉर्ड किसी अन्य प्रशासनिक कार्रवाई से बदल चुका है। कृपया नवीनतम जानकारी पुनः लोड करें।"
        : "प्रशासनिक टिप्पणी सहेजी नहीं जा सकी।"
    );
  }

  const details = mapDetails(data);

  if (!details) {
    return serviceFailure("NOTES_FAILED", "अपडेट के बाद रिकॉर्ड प्राप्त नहीं हो सका।");
  }

  return serviceSuccess(await hydrateSignedUrls(details));
}
