import type { DashboardMetric } from "../types/admin-dashboard.types";
import type { AdminDashboardMetrics } from "../../../services/admin-dashboard.service";

export const dashboardMetrics: DashboardMetric[] = [
  { id: "total", title: "कुल पंजीकरण", value: null },
  { id: "awaiting_payment", title: "भुगतान की प्रतीक्षा", value: null },
  { id: "pending_verification", title: "सत्यापन लंबित", value: null },
  { id: "approved", title: "स्वीकृत पंजीकरण", value: null },
  { id: "rejected", title: "अस्वीकृत पंजीकरण", value: null },
  { id: "submitted_today", title: "आज जमा हुए", value: null }
];

export function buildDashboardMetrics(
  metrics: AdminDashboardMetrics | null,
  language: "hi" | "en" = "hi"
): DashboardMetric[] {
  const labels = language === "en"
    ? {
        approved: "Approved registrations",
        awaitingPayment: "Awaiting payment",
        pendingVerification: "Pending verification",
        rejected: "Rejected registrations",
        submittedToday: "Submitted today",
        total: "Total registrations"
      }
    : {
        approved: "स्वीकृत पंजीकरण",
        awaitingPayment: "भुगतान की प्रतीक्षा",
        pendingVerification: "सत्यापन लंबित",
        rejected: "अस्वीकृत पंजीकरण",
        submittedToday: "आज जमा हुए",
        total: "कुल पंजीकरण"
      };

  return [
    { id: "total", title: labels.total, value: metrics?.totalRegistrations ?? null },
    { id: "awaiting_payment", title: labels.awaitingPayment, value: metrics?.awaitingPayment ?? null },
    { id: "pending_verification", title: labels.pendingVerification, value: metrics?.pendingVerification ?? null },
    { id: "approved", title: labels.approved, value: metrics?.approvedRegistrations ?? null },
    { id: "rejected", title: labels.rejected, value: metrics?.rejectedRegistrations ?? null },
    { id: "submitted_today", title: labels.submittedToday, value: metrics?.submittedToday ?? null }
  ];
}
