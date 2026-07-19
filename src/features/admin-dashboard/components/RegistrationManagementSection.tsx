import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { OutlineButton, PrimaryButton } from "../../../components/common/Button";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { SectionContainer } from "../../../components/common/SectionContainer";
import { useLanguage } from "../../language/LanguageContext";
import type {
  AdminRegistrationFilters,
  AdminRegistrationListResult
} from "../../../services/admin-dashboard.service";
import { RegistrationTableToolbar } from "./RegistrationTableToolbar";
import { RegistrationDataTable } from "./RegistrationDataTable";
import { RegistrationMobileList } from "./RegistrationMobileList";

type RegistrationManagementSectionProps = {
  data: AdminRegistrationListResult | null;
  error: string | null;
  filters: AdminRegistrationFilters;
  isLoading: boolean;
  onExport: () => void;
  onFiltersChange: (filters: AdminRegistrationFilters) => void;
  onRefresh: () => void;
};

export function RegistrationManagementSection({
  data,
  error,
  filters,
  isLoading,
  onExport,
  onFiltersChange,
  onRefresh
}: RegistrationManagementSectionProps) {
  const { language, localized } = useLanguage();

  return (
    <SectionContainer
      className="scroll-mt-24"
      description={localized(
        "खोज, फ़िल्टर, समीक्षा और निर्यात वास्तविक अधिकृत डेटा पर लागू होते हैं।",
        "Search, filters, review and export apply to real authorized data."
      )}
      title={localized("सभी पंजीकरण", "All registrations")}
      variant="card"
    >
      <div id="registrations" className="flex flex-col gap-5">
        <RegistrationTableToolbar
          filters={filters}
          isLoading={isLoading}
          onChange={onFiltersChange}
          onExport={onExport}
          onRefresh={onRefresh}
        />
        {isLoading ? (
          <div className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
            <LoadingSpinner label={localized("पंजीकरण सूची लोड हो रही है…", "Registration list is loading…")} />
          </div>
        ) : null}
        {error ? (
          <ErrorState
            action={<PrimaryButton onClick={onRefresh}>{localized("पुनः प्रयास करें", "Try again")}</PrimaryButton>}
            description={error}
            title={localized("पंजीकरण सूची उपलब्ध नहीं हुई", "Registration list is unavailable")}
          />
        ) : null}
        {!isLoading && !error && data?.rows.length === 0 ? (
          <EmptyState
            description={localized(
              "चयनित फ़िल्टर के अनुसार कोई पंजीकरण रिकॉर्ड उपलब्ध नहीं है।",
              "No registration records are available for the selected filters."
            )}
            title={localized("कोई पंजीकरण नहीं मिला", "No registrations found")}
          />
        ) : null}
        {!isLoading && !error && data && data.rows.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <RegistrationDataTable rows={data.rows} />
            </div>
            <div className="lg:hidden">
              <RegistrationMobileList rows={data.rows} />
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-maroon-700/10 bg-cream-50 p-4 text-sm leading-7 text-brown-800 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {localized("पृष्ठ", "Page")} {data.pagination.page.toLocaleString(language === "en" ? "en-IN" : "hi-IN")} /{" "}
                {data.pagination.totalPages.toLocaleString(language === "en" ? "en-IN" : "hi-IN")} • {localized("कुल", "total")}{" "}
                {data.pagination.totalItems.toLocaleString(language === "en" ? "en-IN" : "hi-IN")} {localized("रिकॉर्ड", "records")}
              </p>
              <div className="flex gap-3">
                <OutlineButton
                  disabled={data.pagination.page <= 1}
                  onClick={() => onFiltersChange({ ...filters, page: filters.page - 1 })}
                >
                  {localized("पिछला", "Previous")}
                </OutlineButton>
                <OutlineButton
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => onFiltersChange({ ...filters, page: filters.page + 1 })}
                >
                  {localized("अगला", "Next")}
                </OutlineButton>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SectionContainer>
  );
}
