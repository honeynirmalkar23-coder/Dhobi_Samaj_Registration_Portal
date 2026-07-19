import { useCallback, useEffect, useMemo, useState } from "react";
import { DatabaseZap } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { useLanguage } from "../../language/LanguageContext";
import { getSupabaseConfiguration } from "../../../lib/supabase/configuration";
import { getDataBackendMode } from "../../../services/backend/backend-mode";
import { useAdminAuth } from "../../admin-auth/hooks/useAdminAuth";
import {
  buildRegistrationsCsv,
  loadAdminDashboardMetrics,
  loadAdminRegistrations
} from "../../../services/admin-dashboard.service";
import type {
  AdminDashboardMetrics,
  AdminRegistrationFilters,
  AdminRegistrationListResult
} from "../../../services/admin-dashboard.service";
import { buildDashboardMetrics } from "../utilities/admin-dashboard-display";
import { DashboardMetricsGrid } from "./DashboardMetricsGrid";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { ExportClearDatabaseButton } from "./ExportClearDatabaseButton";
import { RegistrationManagementSection } from "./RegistrationManagementSection";

const defaultFilters: AdminRegistrationFilters = {
  search: "",
  registrationStatus: "",
  paymentStatus: "",
  createdOn: "",
  sort: "newest",
  page: 1,
  pageSize: 20
};

export function AdminDashboardContent() {
  const { language, localized } = useLanguage();
  const { authenticationMode } = useAdminAuth();
  const supabaseConfiguration = getSupabaseConfiguration();
  const isLocalDataBackend = getDataBackendMode() === "local-dev";
  const showLocalBackendUnavailableNotice =
    authenticationMode === "local-dev" && !isLocalDataBackend && supabaseConfiguration.state !== "configured";
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [registrationData, setRegistrationData] = useState<AdminRegistrationListResult | null>(null);
  const [filters, setFilters] = useState<AdminRegistrationFilters>(defaultFilters);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const metricCards = useMemo(() => buildDashboardMetrics(metrics, language), [language, metrics]);

  const refreshMetrics = useCallback(async () => {
    const result = await loadAdminDashboardMetrics();

    if (!result.ok) {
      setDashboardError(result.message);
      setMetrics(null);
      return;
    }

    setDashboardError(null);
    setMetrics(result.data);
  }, []);

  const refreshRegistrations = useCallback(async () => {
    setIsLoadingRegistrations(true);
    const result = await loadAdminRegistrations(filters);
    setIsLoadingRegistrations(false);

    if (!result.ok) {
      setRegistrationError(result.message);
      setRegistrationData(null);
      return;
    }

    setRegistrationError(null);
    setRegistrationData(result.data);
  }, [filters]);

  useEffect(() => {
    void refreshMetrics();
  }, [refreshMetrics]);

  useEffect(() => {
    void refreshRegistrations();
  }, [refreshRegistrations]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      refreshMetrics(),
      refreshRegistrations()
    ]);
  }, [refreshMetrics, refreshRegistrations]);

  const exportCurrentRows = () => {
    if (!registrationData?.rows.length) {
      setRegistrationError(localized("निर्यात के लिए कोई रिकॉर्ड उपलब्ध नहीं है।", "No records are available for export."));
      return;
    }

    const csv = buildRegistrationsCsv(registrationData.rows);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dhobi-samaj-registrations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={localized(
          "पंजीकरण, भुगतान सत्यापन और प्रशासनिक गतिविधियों का प्रबंधन करें।",
          "Manage registrations, payment verification and administrative activity."
        )}
        title={localized("प्रशासन डैशबोर्ड", "Admin Dashboard")}
      />

      <div className="flex gap-3 rounded-lg border border-saffron-500/25 bg-saffron-50 px-4 py-3 text-sm leading-7 text-brown-800">
        <DatabaseZap aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-maroon-700" />
        <p>
          {isLocalDataBackend
            ? localized(
                "डैशबोर्ड स्थानीय परीक्षण SQLite backend से वास्तविक स्थानीय डेटा प्राप्त करता है।",
                "The dashboard loads real local data from the local test SQLite backend."
              )
            : localized(
                "डैशबोर्ड अब सुरक्षित Supabase RLS और प्रशासनिक RPCs से वास्तविक डेटा प्राप्त करता है।",
                "The dashboard now loads real data from secure Supabase RLS and administrative RPCs."
              )}
        </p>
      </div>

      {showLocalBackendUnavailableNotice ? (
        <div
          className="rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 px-4 py-3 text-sm leading-7 text-brown-800"
          role="status"
        >
          {localized(
            "स्थानीय प्रशासन लॉगिन सक्रिय है, लेकिन पंजीकरण डेटाबेस कॉन्फ़िगर नहीं है। डेटा-आधारित सुविधाओं की जांच के लिए hosted Supabase या अन्य सुरक्षित backend आवश्यक है।",
            "Local admin login is active, but the registration database is not configured. Hosted Supabase or another secure backend is required to test data-based features."
          )}
        </div>
      ) : null}

      {dashboardError ? (
        <div className="rounded-lg border border-maroon-700/25 bg-maroon-50 px-4 py-3 text-sm font-semibold leading-7 text-maroon-900">
          {dashboardError}
        </div>
      ) : null}

      <DashboardMetricsGrid metrics={metricCards} />
      <RegistrationManagementSection
        data={registrationData}
        error={registrationError}
        filters={filters}
        isLoading={isLoadingRegistrations}
        onExport={exportCurrentRows}
        onFiltersChange={setFilters}
        onRefresh={() => void refreshDashboard()}
      />
      <ExportClearDatabaseButton onCleared={refreshDashboard} />
      <DashboardQuickActions />
    </div>
  );
}
