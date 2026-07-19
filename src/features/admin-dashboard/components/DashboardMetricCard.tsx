import { useLanguage } from "../../language/LanguageContext";
import type { DashboardMetric } from "../types/admin-dashboard.types";

type DashboardMetricCardProps = {
  metric: DashboardMetric;
};

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  const { language, localized } = useLanguage();
  const loadingLabel = localized("लोड हो रहा है", "Loading");
  const helperText = metric.helperText ?? (metric.value === null
    ? loadingLabel
    : localized("वास्तविक डेटाबेस डेटा", "Real database data"));

  return (
    <article
      aria-label={`${metric.title}: ${metric.value ?? loadingLabel}`}
      className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle"
    >
      <h2 className="text-sm font-semibold leading-6 text-brown-700">{metric.title}</h2>
      <p className="mt-4 text-4xl font-bold text-maroon-900">
        {metric.value === null ? "—" : metric.value.toLocaleString(language === "en" ? "en-IN" : "hi-IN")}
      </p>
      <p className="mt-3 text-sm leading-7 text-brown-700">
        {helperText}
      </p>
    </article>
  );
}
