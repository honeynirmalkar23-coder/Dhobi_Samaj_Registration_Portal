import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AdminRoute } from "./route-guards/AdminRoute";
import { PublicLayout } from "../components/layout/PublicLayout";
import { RouteErrorPage } from "../components/common/RouteErrorPage";
import { adminRouteSegments, routePaths } from "../config/routes.config";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminPaymentSettingsPage } from "../pages/admin/AdminPaymentSettingsPage";
import { AdminProfilePage } from "../pages/admin/AdminProfilePage";
import { AdminRegistrationDetailsPage } from "../pages/admin/AdminRegistrationDetailsPage";
import { HomePage } from "../pages/public/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PaymentPage } from "../pages/public/PaymentPage";
import { RegistrationPage } from "../pages/public/RegistrationPage";
import { StatusPage } from "../pages/public/StatusPage";

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: routePaths.registration,
        element: <RegistrationPage />
      },
      {
        path: routePaths.paymentDetail,
        element: <PaymentPage />
      },
      {
        path: routePaths.status,
        element: <StatusPage />
      },
      {
        path: routePaths.adminLogin,
        element: <AdminLoginPage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  },
  {
    path: routePaths.adminRoot,
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate replace to={routePaths.adminDashboard} />
      },
      {
        path: adminRouteSegments.dashboard,
        element: <AdminDashboardPage />
      },
      {
        path: adminRouteSegments.registrationDetail,
        element: <AdminRegistrationDetailsPage />
      },
      {
        path: adminRouteSegments.profile,
        element: <AdminProfilePage />
      },
      {
        path: adminRouteSegments.paymentSettings,
        element: <AdminPaymentSettingsPage />
      },
      {
        path: adminRouteSegments.auditLogs,
        element: <AdminAuditLogsPage />
      }
    ]
  }
]);
