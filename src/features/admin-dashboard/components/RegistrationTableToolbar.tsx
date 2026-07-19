import { Download, RefreshCw } from "lucide-react";
import { paymentStatusConfig, registrationStatusConfig } from "../../../config/statuses.config";
import { OutlineButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentStatus, RegistrationStatus } from "../../../types/status";
import type { AdminRegistrationFilters } from "../../../services/admin-dashboard.service";

type RegistrationTableToolbarProps = {
  filters: AdminRegistrationFilters;
  isLoading: boolean;
  onChange: (filters: AdminRegistrationFilters) => void;
  onExport: () => void;
  onRefresh: () => void;
};

export function RegistrationTableToolbar({
  filters,
  isLoading,
  onChange,
  onExport,
  onRefresh
}: RegistrationTableToolbarProps) {
  const { language, localized } = useLanguage();

  const updateFilters = (updates: Partial<AdminRegistrationFilters>) => {
    onChange({
      ...filters,
      ...updates,
      page: updates.page ?? 1
    });
  };

  return (
    <div
      className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 text-sm font-semibold text-brown-800">
          <span>{localized("नाम या पंजीकरण आईडी खोजें", "Search name or registration ID")}</span>
          <input
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-white px-3 py-2.5 text-brown-800"
            onChange={(event) => updateFilters({ search: event.currentTarget.value })}
            placeholder={localized("खोज", "Search")}
            type="search"
            value={filters.search}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-brown-800">
          <span>{localized("पंजीकरण स्थिति", "Registration status")}</span>
          <select
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-white px-3 py-2.5 text-brown-800"
            onChange={(event) =>
              updateFilters({ registrationStatus: event.currentTarget.value as RegistrationStatus | "" })
            }
            value={filters.registrationStatus}
          >
            <option value="">{localized("सभी स्थितियां", "All statuses")}</option>
            {Object.entries(registrationStatusConfig).map(([value, status]) => (
              <option key={value} value={value}>{language === "en" ? status.labelEn : status.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold text-brown-800">
          <span>{localized("भुगतान स्थिति", "Payment status")}</span>
          <select
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-white px-3 py-2.5 text-brown-800"
            onChange={(event) =>
              updateFilters({ paymentStatus: event.currentTarget.value as PaymentStatus | "" })
            }
            value={filters.paymentStatus}
          >
            <option value="">{localized("सभी भुगतान स्थितियां", "All payment statuses")}</option>
            {Object.entries(paymentStatusConfig).map(([value, status]) => (
              <option key={value} value={value}>{language === "en" ? status.labelEn : status.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-semibold text-brown-800">
          <span>{localized("तारीख", "Date")}</span>
          <input
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-white px-3 py-2.5 text-brown-800"
            onChange={(event) => updateFilters({ createdOn: event.currentTarget.value })}
            type="date"
            value={filters.createdOn}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold text-brown-800">
          <span>{localized("क्रम", "Order")}</span>
          <select
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-white px-3 py-2.5 text-brown-800"
            onChange={(event) => updateFilters({ sort: event.currentTarget.value as "newest" | "oldest" })}
            value={filters.sort}
          >
            <option value="newest">{localized("नवीनतम पहले", "Newest first")}</option>
            <option value="oldest">{localized("पुराने पहले", "Oldest first")}</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <OutlineButton disabled={isLoading} onClick={onExport}>
          <Download aria-hidden="true" className="h-5 w-5" />
          {localized("CSV निर्यात करें", "Export CSV")}
        </OutlineButton>
        <OutlineButton disabled={isLoading} onClick={onRefresh}>
          <RefreshCw aria-hidden="true" className="h-5 w-5" />
          {localized("रीफ़्रेश", "Refresh")}
        </OutlineButton>
      </div>
    </div>
  );
}
