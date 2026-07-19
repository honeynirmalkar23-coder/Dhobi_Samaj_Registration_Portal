import { useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { OutlineButton, PrimaryButton } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { PageHeader } from "../../components/common/PageHeader";
import { useLanguage } from "../../features/language/LanguageContext";
import { formatPublicDate } from "../../lib/utilities/dates";
import { loadAdminAuditLogs } from "../../services/admin-audit.service";
import type { AdminAuditFilters, AdminAuditResult } from "../../services/admin-audit.service";
import { usePageMetadata } from "../../hooks/usePageMetadata";

const defaultFilters: AdminAuditFilters = {
  action: "",
  registrationId: "",
  from: "",
  to: "",
  page: 1,
  pageSize: 20
};

const actionLabels: Record<string, string> = {
  payment_settings_updated: "भुगतान सेटिंग्स अपडेट",
  payment_verified: "भुगतान सत्यापित",
  payment_rejected: "भुगतान अस्वीकृत",
  registration_marked_under_review: "समीक्षा में मार्क",
  registration_approved: "पंजीकरण स्वीकृत",
  registration_rejected: "पंजीकरण अस्वीकृत",
  registration_archived: "पंजीकरण संग्रहित",
  payment_resubmission_enabled: "भुगतान पुनः जमा सक्षम",
  admin_note_updated: "प्रशासनिक टिप्पणी अपडेट"
};

const actionLabelsEn: Record<string, string> = {
  payment_settings_updated: "Payment settings updated",
  payment_verified: "Payment verified",
  payment_rejected: "Payment rejected",
  registration_marked_under_review: "Marked under review",
  registration_approved: "Registration approved",
  registration_rejected: "Registration rejected",
  registration_archived: "Registration archived",
  payment_resubmission_enabled: "Payment resubmission enabled",
  admin_note_updated: "Admin note updated"
};

export function AdminAuditLogsPage() {
  const { language, localized } = useLanguage();
  const activeActionLabels = language === "en" ? actionLabelsEn : actionLabels;
  const [filters, setFilters] = useState<AdminAuditFilters>(defaultFilters);
  const [result, setResult] = useState<AdminAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMetadata({
    title: localized("ऑडिट लॉग", "Audit logs"),
    description: localized(
      "प्रशासनिक गतिविधियों का सुरक्षित ऑडिट लॉग।",
      "Secure audit log of administrative activity."
    )
  });

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    const logs = await loadAdminAuditLogs(filters);
    setIsLoading(false);

    if (!logs.ok) {
      setError(logs.message);
      setResult(null);
      return;
    }

    setError(null);
    setResult(logs.data);
  }, [filters]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const updateFilters = (updates: Partial<AdminAuditFilters>) => {
    setFilters({
      ...filters,
      ...updates,
      page: updates.page ?? 1
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={localized(
          "प्रशासनिक गतिविधियों का सुरक्षित लॉग, नवीनतम पहले।",
          "Secure log of administrative activity, newest first."
        )}
        title={localized("ऑडिट लॉग", "Audit logs")}
      />

      <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2 text-sm font-semibold text-brown-800">
            <span>{localized("कार्रवाई", "Action")}</span>
            <select
              className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-cream-50 px-3 py-2.5"
              onChange={(event) => updateFilters({ action: event.currentTarget.value })}
              value={filters.action}
            >
              <option value="">{localized("सभी कार्रवाइयां", "All actions")}</option>
              {Object.entries(activeActionLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-brown-800">
            <span>{localized("पंजीकरण आईडी", "Registration ID")}</span>
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-cream-50 px-3 py-2.5"
              onChange={(event) => updateFilters({ registrationId: event.currentTarget.value })}
              placeholder="DS-YYYY-000001"
              value={filters.registrationId}
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-brown-800">
            <span>{localized("से", "From")}</span>
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-cream-50 px-3 py-2.5"
              onChange={(event) => updateFilters({ from: event.currentTarget.value })}
              type="date"
              value={filters.from}
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-brown-800">
            <span>{localized("तक", "To")}</span>
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/15 bg-cream-50 px-3 py-2.5"
              onChange={(event) => updateFilters({ to: event.currentTarget.value })}
              type="date"
              value={filters.to}
            />
          </label>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
          <LoadingSpinner label={localized("ऑडिट लॉग लोड हो रहे हैं…", "Audit logs are loading…")} />
        </div>
      ) : null}

      {error ? (
        <ErrorState
          action={<PrimaryButton onClick={() => void loadLogs()}>{localized("पुनः प्रयास करें", "Try again")}</PrimaryButton>}
          description={error}
          title={localized("ऑडिट लॉग उपलब्ध नहीं हुए", "Audit logs are unavailable")}
        />
      ) : null}

      {!isLoading && !error && result?.rows.length === 0 ? (
        <EmptyState
          description={localized(
            "चयनित फ़िल्टर के अनुसार कोई ऑडिट गतिविधि उपलब्ध नहीं है।",
            "No audit activity is available for the selected filters."
          )}
          icon={ScrollText}
          title={localized("अभी कोई ऑडिट गतिविधि उपलब्ध नहीं है।", "No audit activity is available yet.")}
        />
      ) : null}

      {!isLoading && !error && result && result.rows.length > 0 ? (
        <section className="rounded-lg border border-maroon-700/10 bg-white shadow-subtle">
          <div className="divide-y divide-maroon-700/10">
            {result.rows.map((row) => (
              <article className="p-4" key={row.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-bold text-maroon-900">
                      {activeActionLabels[row.action] ?? row.action}
                    </h2>
                    <p className="mt-1 text-sm leading-7 text-brown-700">
                      {formatPublicDate(row.createdAt, { includeTime: true })}
                    </p>
                  </div>
                  <p className="break-words text-sm font-semibold text-brown-800">
                    {row.registrationId ?? localized("सामान्य प्रशासनिक कार्रवाई", "General administrative action")}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-maroon-700/10 bg-cream-50 p-4 text-sm leading-7 text-brown-800 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {localized("पृष्ठ", "Page")} {filters.page.toLocaleString(language === "en" ? "en-IN" : "hi-IN")} / {result.totalPages.toLocaleString(language === "en" ? "en-IN" : "hi-IN")}
            </p>
            <div className="flex gap-3">
              <OutlineButton disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })}>
                {localized("पिछला", "Previous")}
              </OutlineButton>
              <OutlineButton disabled={filters.page >= result.totalPages} onClick={() => updateFilters({ page: filters.page + 1 })}>
                {localized("अगला", "Next")}
              </OutlineButton>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
