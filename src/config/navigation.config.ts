import {
  ArrowLeft,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  ScrollText,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { routeLabels, routePaths } from "./routes.config";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  disabled?: boolean;
  description?: string;
};

export const publicNavigation: NavigationItem[] = [
  {
    label: routeLabels.home,
    to: routePaths.home,
    icon: Home,
    end: true
  },
  {
    label: routeLabels.registration,
    to: routePaths.registration,
    icon: UserPlus
  },
  {
    label: routeLabels.status,
    to: routePaths.status,
    icon: Search
  },
  {
    label: routeLabels.adminLogin,
    to: routePaths.adminLogin,
    icon: ShieldCheck
  }
];

export const adminNavigation: NavigationItem[] = [
  {
    label: routeLabels.adminDashboard,
    to: routePaths.adminDashboard,
    icon: LayoutDashboard,
    end: true
  },
  {
    label: routeLabels.adminProfile,
    to: routePaths.adminProfile,
    icon: UserCog
  },
  {
    label: routeLabels.adminRegistrations,
    to: `${routePaths.adminDashboard}#registrations`,
    icon: ClipboardList,
    description: "सभी पंजीकरण अनुभाग"
  },
  {
    label: routeLabels.adminPaymentSettings,
    to: routePaths.adminPaymentSettings,
    icon: CreditCard
  },
  {
    label: routeLabels.adminAuditLogs,
    to: routePaths.adminAuditLogs,
    icon: ScrollText
  },
  {
    label: "पोर्टल पर वापस जाएं",
    to: routePaths.home,
    icon: ArrowLeft,
    end: true
  }
];
