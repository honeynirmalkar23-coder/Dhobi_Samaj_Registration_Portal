import { getSupabaseClient } from "../lib/supabase/client";
import type { Json } from "../lib/supabase/database.types";
import type { ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";
import { dataBackendMode } from "./backend/backend-mode";

export type AdminAuditLogEntry = {
  id: string;
  adminUserId: string;
  action: string;
  registrationId: string | null;
  metadata: Json | null;
  createdAt: string;
};

export type AdminAuditFilters = {
  action: string;
  registrationId: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminAuditResult = {
  rows: AdminAuditLogEntry[];
  totalItems: number;
  totalPages: number;
};

export async function loadAdminAuditLogs(
  filters: AdminAuditFilters
): Promise<ServiceResult<AdminAuditResult>> {
  if (dataBackendMode === "local-dev") {
    const { loadLocalAdminAuditLogs } = await import("./backend/local-portal.client");

    return loadLocalAdminAuditLogs(filters);
  }

  return loadSupabaseAdminAuditLogs(filters);
}

async function loadSupabaseAdminAuditLogs(
  filters: AdminAuditFilters
): Promise<ServiceResult<AdminAuditResult>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase.rpc("admin_audit_log_entries", {
    p_action: filters.action || null,
    p_registration_id: filters.registrationId || null,
    p_from: filters.from || null,
    p_to: filters.to || null,
    p_page: filters.page,
    p_page_size: filters.pageSize
  });

  if (error) {
    return serviceFailure("AUDIT_FAILED", "ऑडिट लॉग प्राप्त नहीं हो सके।");
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    adminUserId: row.admin_user_id,
    action: row.action,
    registrationId: row.registration_id,
    metadata: row.metadata,
    createdAt: row.created_at
  }));
  const totalItems = Number(data?.[0]?.total_count ?? 0);

  return serviceSuccess({
    rows,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / filters.pageSize))
  });
}
