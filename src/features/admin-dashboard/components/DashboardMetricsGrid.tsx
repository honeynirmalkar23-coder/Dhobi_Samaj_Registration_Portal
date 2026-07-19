import type { DashboardMetric } from "../types/admin-dashboard.types";
import { dashboardMetrics } from "../utilities/admin-dashboard-display";
import { DashboardMetricCard } from "./DashboardMetricCard";

type DashboardMetricsGridProps = {
  metrics?: DashboardMetric[];
};

export function DashboardMetricsGrid({ metrics = dashboardMetrics }: DashboardMetricsGridProps) {
  return (
    <section aria-labelledby="dashboard-summary-title">
      <h2 className="sr-only" id="dashboard-summary-title">
        डैशबोर्ड सारांश
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}
