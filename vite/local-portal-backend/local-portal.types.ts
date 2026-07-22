// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database as BetterSqliteDatabase } from "better-sqlite3";

export type DataBackendMode = "supabase" | "local-dev";

export type LocalPortalConfigurationState =
  | "configured"
  | "missing_signing_secret"
  | "invalid_signing_secret"
  | "invalid_data_directory"
  | "disabled";

export type LocalPortalConfig =
  | {
      state: "configured";
      projectRoot: string;
      dataDirectory: string;
      databasePath: string;
      uploadsDirectory: string;
      temporaryDirectory: string;
      signingSecret: string;
      adminSessionSecret: string | null;
      allowLan: boolean;
    }
  | {
      state: Exclude<LocalPortalConfigurationState, "configured">;
      projectRoot: string;
      missingVariables: string[];
      allowLan: boolean;
    };

export type LocalPortalContext = {
  config: LocalPortalConfig;
  db: BetterSqliteDatabase | null;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type LocalAdminIdentity = {
  email: string;
  role: "admin";
  authenticationMode: "local-dev";
};

export type StoredUpload = {
  relativePath: string;
  absolutePath: string;
  mimeType: string;
  sizeBytes: number;
};

export type ParsedMultipartFile = {
  fieldName: string;
  originalFilename: string | null;
  declaredMimeType: string;
  buffer: Buffer;
};

export type ParsedMultipartForm = {
  fields: Map<string, string>;
  files: Map<string, ParsedMultipartFile>;
};

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

export type PaymentProofStatus = "pending_verification" | "verified" | "rejected";

export type PaymentSettingsRow = {
  payment_enabled: 0 | 1;
  qr_code_path: string | null;
  qr_code_mime_type: string | null;
  qr_code_size_bytes: number | null;
  upi_id: string | null;
  payee_name: string | null;
  amount: number | null;
  payment_title: string | null;
  instructions: string | null;
  public_contact: string | null;
  payment_deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationRow = {
  id: string;
  registration_id: string;
  full_name: string;
  age: number;
  mobile_number: string | null;
  education_level: string;
  education_details: string | null;
  permanent_address: string;
  boys_count: number;
  girls_count: number;
  elders_count: number;
  total_family_members: number;
  applicant_photo_path: string;
  applicant_photo_mime_type: string;
  applicant_photo_size_bytes: number;
  registration_status: RegistrationStatus;
  payment_status: PaymentStatus;
  payment_access_token_hash: string;
  payment_access_token_expires_at: string;
  payment_resubmission_allowed: 0 | 1;
  public_rejection_message: string | null;
  admin_notes: string | null;
  payment_submitted_at: string | null;
  payment_verified_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
};

export type PaymentProofRow = {
  id: string;
  registration_record_id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  proof_status: PaymentProofStatus;
  acknowledgement_number: string;
  public_rejection_message: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
};
