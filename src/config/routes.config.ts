export const routePaths = {
  home: "/",
  registration: "/registration",
  paymentDetail: "/payment/:registrationId",
  status: "/status",
  adminLogin: "/admin/login",
  adminRoot: "/admin",
  adminDashboard: "/admin/dashboard",
  adminRegistrationDetail: "/admin/registrations/:registrationId",
  adminProfile: "/admin/profile",
  adminPaymentSettings: "/admin/payment-settings",
  adminAuditLogs: "/admin/audit-logs"
} as const;

export const adminRouteSegments = {
  dashboard: "dashboard",
  registrationDetail: "registrations/:registrationId",
  profile: "profile",
  paymentSettings: "payment-settings",
  auditLogs: "audit-logs"
} as const;

export const routeLabels = {
  home: "होम",
  registration: "नया पंजीकरण",
  status: "पंजीकरण खोजें",
  adminLogin: "प्रशासन लॉगिन",
  adminDashboard: "डैशबोर्ड",
  adminRegistrations: "सभी पंजीकरण",
  adminRegistrationDetail: "पंजीकरण विवरण",
  adminProfile: "प्रशासन प्रोफाइल",
  adminPaymentSettings: "भुगतान सेटिंग्स",
  adminAuditLogs: "ऑडिट लॉग"
} as const;

export const routePrefixes = {
  adminRegistrations: "/admin/registrations/"
} as const;

export const routeBuilders = {
  paymentDetail: (registrationId: string) =>
    `/payment/${encodeURIComponent(registrationId)}`,
  adminRegistrationDetail: (registrationId: string) =>
    `/admin/registrations/${encodeURIComponent(registrationId)}`
} as const;
