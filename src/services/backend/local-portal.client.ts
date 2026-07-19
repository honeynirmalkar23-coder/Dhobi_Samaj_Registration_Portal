import type { PaymentSettingsInput } from "../../features/payment-settings/types/payment-settings.types";
import type { PaymentProofFormInputValues } from "../../features/payment/types/payment.types";
import type { RegistrationFormInputValues } from "../../features/registration/types/registration-form.types";
import type { PublicRegistrationStatus } from "../../features/status-search/types/status-search.types";
import type {
  AdminRegistrationExportRow,
  ExportClearDatabaseResult
} from "../admin-database.types";
import type {
  AdminDashboardMetrics,
  AdminRegistrationFilters,
  AdminRegistrationListResult
} from "../admin-dashboard.service";
import type { AdminAuditFilters, AdminAuditResult } from "../admin-audit.service";
import type { AdminRegistrationDetails } from "../admin-registration.service";
import type { AdminPaymentSettings } from "../payment-settings.service";
import type { CreateRegistrationResult } from "../registration.service";
import type { PublicPaymentSettingsResult, SubmitPaymentProofResult } from "../payment.service";
import { serviceFailure, serviceSuccess } from "../api.types";
import type { ServiceResult } from "../api.types";
import type { LocalApiResponse } from "./portal-backend.types";

type LocalAdminPaymentSettings = AdminPaymentSettings & {
  dataSource?: "local-dev";
  localTestingBadge?: string;
  saveMessage?: string;
};

const basePath = "/api/local-portal";
const genericMessage = "स्थानीय परीक्षण backend उपलब्ध नहीं है।";

async function parseLocalResponse<T>(response: Response): Promise<ServiceResult<T>> {
  let body: LocalApiResponse<T> | null = null;

  try {
    body = (await response.json()) as LocalApiResponse<T>;
  } catch {
    return serviceFailure("INVALID_RESPONSE", genericMessage, response.status);
  }

  if (!body.success) {
    return serviceFailure(body.error.code, body.error.message, response.status);
  }

  return serviceSuccess(body.data);
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<ServiceResult<T>> {
  try {
    const response = await fetch(`${basePath}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        } : {}),
        ...options.headers
      }
    });

    return parseLocalResponse<T>(response);
  } catch {
    return serviceFailure("NETWORK_ERROR", genericMessage);
  }
}

async function requestForm<T>(
  path: string,
  formData: FormData,
  method = "POST"
): Promise<ServiceResult<T>> {
  try {
    const response = await fetch(`${basePath}${path}`, {
      body: formData,
      credentials: "include",
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      },
      method
    });

    return parseLocalResponse<T>(response);
  } catch {
    return serviceFailure("NETWORK_ERROR", genericMessage);
  }
}

function appendValue(formData: FormData, name: string, value: string | number | boolean | null) {
  if (value !== null) {
    formData.append(name, String(value));
  }
}

export function buildLocalRegistrationFormData(values: RegistrationFormInputValues): FormData {
  const formData = new FormData();

  appendValue(formData, "fullName", values.fullName);
  appendValue(formData, "age", values.age);
  appendValue(formData, "educationLevel", values.educationLevel);
  appendValue(formData, "educationDetails", values.educationDetails);
  appendValue(formData, "permanentAddress", values.permanentAddress);
  appendValue(formData, "boysCount", values.boysCount);
  appendValue(formData, "girlsCount", values.girlsCount);
  appendValue(formData, "eldersCount", values.eldersCount);
  appendValue(formData, "declarationAccepted", values.declarationAccepted);

  if (values.applicantPhoto) {
    formData.append("applicantPhoto", values.applicantPhoto);
  }

  return formData;
}

export function createLocalRegistration(
  values: RegistrationFormInputValues
): Promise<ServiceResult<CreateRegistrationResult>> {
  return requestForm<CreateRegistrationResult>("/registration", buildLocalRegistrationFormData(values));
}

export function loadLocalAdminPaymentSettings(): Promise<ServiceResult<LocalAdminPaymentSettings>> {
  return requestJson<LocalAdminPaymentSettings>("/admin/payment-settings");
}

export function saveLocalAdminPaymentSettings(params: {
  input: PaymentSettingsInput;
  currentQrCodePath: string | null;
}): Promise<ServiceResult<LocalAdminPaymentSettings>> {
  const formData = new FormData();

  appendValue(formData, "paymentEnabled", params.input.paymentEnabled);
  appendValue(formData, "existingQrCodePath", params.currentQrCodePath);
  appendValue(formData, "upiId", params.input.upiId);
  appendValue(formData, "payeeName", params.input.payeeName);
  appendValue(formData, "registrationFee", params.input.registrationFee);
  appendValue(formData, "paymentTitle", params.input.paymentTitle);
  appendValue(formData, "paymentInstructions", params.input.paymentInstructions);
  appendValue(formData, "publicSupportContact", params.input.publicSupportContact);
  appendValue(formData, "paymentDeadline", params.input.paymentDeadline);

  if (params.input.qrCodeFile) {
    formData.append("qrCodeFile", params.input.qrCodeFile);
  }

  return requestForm<LocalAdminPaymentSettings>("/admin/payment-settings", formData, "PUT");
}

export async function getLocalPublicPaymentSettings(): Promise<ServiceResult<PublicPaymentSettingsResult>> {
  const result = await requestJson<{
    paymentEnabled: boolean;
    qrCodeUrl: string | null;
    upiId: string | null;
    payeeName: string | null;
    amount: number | null;
    paymentTitle: string | null;
    instructions: string | null;
    publicContact: string | null;
    paymentDeadline: string | null;
    updatedAt: string | null;
  }>("/public/payment-settings");

  if (!result.ok) {
    return result;
  }

  return serviceSuccess({
    amount: result.data.amount,
    instructions: result.data.instructions,
    payeeName: result.data.payeeName,
    paymentDeadline: result.data.paymentDeadline,
    paymentEnabled: result.data.paymentEnabled,
    paymentTitle: result.data.paymentTitle,
    publicContact: result.data.publicContact,
    qrCodeUrl: result.data.qrCodeUrl,
    updatedAt: result.data.updatedAt,
    upiId: result.data.upiId
  });
}

export type LocalSubmitPaymentProofResult = SubmitPaymentProofResult & {
  acknowledgementAvailable: boolean;
  acknowledgementNumber: string;
  acknowledgementDownloadUrl: string;
};

export function submitLocalPaymentProof(params: {
  registrationId: string;
  paymentAccessToken: string;
  values: PaymentProofFormInputValues;
}): Promise<ServiceResult<LocalSubmitPaymentProofResult>> {
  const formData = new FormData();

  formData.append("registrationId", params.registrationId);
  formData.append("paymentAccessToken", params.paymentAccessToken);
  formData.append("declarationAccepted", String(params.values.declarationAccepted));

  if (params.values.paymentScreenshot) {
    formData.append("paymentScreenshot", params.values.paymentScreenshot);
  }

  return requestForm<LocalSubmitPaymentProofResult>("/payment-proof", formData);
}

export function getLocalPublicRegistrationStatus(
  registrationId: string
): Promise<ServiceResult<PublicRegistrationStatus>> {
  return requestJson<PublicRegistrationStatus>("/status", {
    body: JSON.stringify({
      registrationId
    }),
    method: "POST"
  });
}

export function loadLocalAdminDashboardMetrics(): Promise<ServiceResult<AdminDashboardMetrics>> {
  return requestJson<AdminDashboardMetrics>("/admin/dashboard/metrics");
}

export function loadLocalAdminRegistrations(
  filters: AdminRegistrationFilters
): Promise<ServiceResult<AdminRegistrationListResult>> {
  const params = new URLSearchParams({
    createdOn: filters.createdOn,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    paymentStatus: filters.paymentStatus,
    registrationStatus: filters.registrationStatus,
    search: filters.search,
    sort: filters.sort
  });

  return requestJson<AdminRegistrationListResult>(`/admin/registrations?${params.toString()}`);
}

export function loadLocalAdminRegistrationExportRows(): Promise<ServiceResult<AdminRegistrationExportRow[]>> {
  return requestJson<AdminRegistrationExportRow[]>("/admin/database/export-rows");
}

export function runLocalAdminDatabaseExportClear(params: {
  expectedExportedRows: number;
  filename: string;
}): Promise<ServiceResult<ExportClearDatabaseResult>> {
  return requestJson<ExportClearDatabaseResult>("/admin/database/export-clear", {
    body: JSON.stringify({
      expectedExportedRows: params.expectedExportedRows,
      filename: params.filename
    }),
    method: "POST"
  });
}

export function loadLocalAdminRegistrationDetails(
  registrationId: string
): Promise<ServiceResult<AdminRegistrationDetails | null>> {
  return requestJson<AdminRegistrationDetails | null>(`/admin/registrations/${encodeURIComponent(registrationId)}`);
}

export function runLocalAdminRegistrationAction(params: {
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
  return requestJson<AdminRegistrationDetails>(`/admin/registrations/${encodeURIComponent(params.registrationId)}/action`, {
    body: JSON.stringify({
      action: params.action,
      expectedVersion: params.expectedVersion,
      publicMessage: params.publicMessage ?? null
    }),
    method: "POST"
  });
}

export function updateLocalAdminNotes(params: {
  registrationId: string;
  expectedVersion: number;
  adminNotes: string;
}): Promise<ServiceResult<AdminRegistrationDetails>> {
  return requestJson<AdminRegistrationDetails>(`/admin/registrations/${encodeURIComponent(params.registrationId)}/notes`, {
    body: JSON.stringify({
      adminNotes: params.adminNotes,
      expectedVersion: params.expectedVersion
    }),
    method: "PUT"
  });
}

export function loadLocalAdminAuditLogs(
  filters: AdminAuditFilters
): Promise<ServiceResult<AdminAuditResult>> {
  const params = new URLSearchParams({
    action: filters.action,
    from: filters.from,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
    registrationId: filters.registrationId,
    to: filters.to
  });

  return requestJson<AdminAuditResult>(`/admin/audit-logs?${params.toString()}`);
}
