import type {
  AdminPaginationState,
  AdminRegistrationListItem
} from "../features/admin-dashboard/types/admin-dashboard.types";
import { getSupabaseClient } from "../lib/supabase/client";
import type { PaymentStatus, RegistrationStatus } from "../types/status";
import type { ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";
import { dataBackendMode } from "./backend/backend-mode";

export type AdminDashboardMetrics = {
  totalRegistrations: number;
  awaitingPayment: number;
  pendingVerification: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  submittedToday: number;
};

export type AdminRegistrationFilters = {
  search: string;
  registrationStatus: RegistrationStatus | "";
  paymentStatus: PaymentStatus | "";
  createdOn: string;
  sort: "newest" | "oldest";
  page: number;
  pageSize: number;
};

export type AdminRegistrationListResult = {
  rows: AdminRegistrationListItem[];
  pagination: AdminPaginationState;
};

function getConfigurationFailure<T>(): ServiceResult<T> {
  return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
}

export async function loadAdminDashboardMetrics(): Promise<ServiceResult<AdminDashboardMetrics>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { loadLocalAdminDashboardMetrics } = await import("./backend/local-portal.client");

    return loadLocalAdminDashboardMetrics();
  }

  return loadSupabaseAdminDashboardMetrics();
}

async function loadSupabaseAdminDashboardMetrics(): Promise<ServiceResult<AdminDashboardMetrics>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getConfigurationFailure();
  }

  const { data, error } = await supabase.rpc("admin_dashboard_metrics");

  if (error) {
    return serviceFailure("METRICS_FAILED", "डैशबोर्ड सारांश प्राप्त नहीं हो सका।");
  }

  const metrics = Array.isArray(data) ? data[0] : data;

  return serviceSuccess({
    totalRegistrations: Number(metrics?.total_registrations ?? 0),
    awaitingPayment: Number(metrics?.awaiting_payment ?? 0),
    pendingVerification: Number(metrics?.pending_verification ?? 0),
    approvedRegistrations: Number(metrics?.approved_registrations ?? 0),
    rejectedRegistrations: Number(metrics?.rejected_registrations ?? 0),
    submittedToday: Number(metrics?.submitted_today ?? 0)
  });
}

export async function loadAdminRegistrations(
  filters: AdminRegistrationFilters
): Promise<ServiceResult<AdminRegistrationListResult>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { loadLocalAdminRegistrations } = await import("./backend/local-portal.client");

    return loadLocalAdminRegistrations(filters);
  }

  return loadSupabaseAdminRegistrations(filters);
}

async function loadSupabaseAdminRegistrations(
  filters: AdminRegistrationFilters
): Promise<ServiceResult<AdminRegistrationListResult>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getConfigurationFailure();
  }

  const { data, error } = await supabase.rpc("admin_list_registrations", {
    p_search: filters.search.trim() || null,
    p_registration_status: filters.registrationStatus || null,
    p_payment_status: filters.paymentStatus || null,
    p_created_on: filters.createdOn || null,
    p_sort: filters.sort,
    p_page: filters.page,
    p_page_size: filters.pageSize
  });

  if (error) {
    return serviceFailure("REGISTRATIONS_FAILED", "पंजीकरण सूची प्राप्त नहीं हो सकी।");
  }

  const rows = (data ?? []).map((row) => ({
    registrationId: row.registration_id,
    fullName: row.full_name,
    age: row.age,
    educationLevel: row.education_level,
    totalFamilyMembers: row.total_family_members,
    registrationStatus: row.registration_status,
    paymentStatus: row.payment_status,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
  const totalItems = Number(data?.[0]?.total_count ?? 0);

  return serviceSuccess({
    rows,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / filters.pageSize))
    }
  });
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const stringValue = String(value ?? "");
  const formulaSafeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;

  return `"${formulaSafeValue.replace(/"/g, '""')}"`;
}

export function buildRegistrationsCsv(rows: AdminRegistrationListItem[]): string {
  const header = [
    "registration_id",
    "full_name",
    "age",
    "education_level",
    "total_family_members",
    "registration_status",
    "payment_status",
    "submitted_at",
    "created_at",
    "updated_at"
  ];
  const body = rows.map((row) =>
    [
      row.registrationId,
      row.fullName,
      row.age,
      row.educationLevel,
      row.totalFamilyMembers,
      row.registrationStatus,
      row.paymentStatus,
      row.submittedAt,
      row.createdAt,
      row.updatedAt
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}
