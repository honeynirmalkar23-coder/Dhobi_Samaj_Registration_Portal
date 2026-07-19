import type { PaymentStatus, RegistrationStatus } from "../../../types/status";

export type AdminRegistrationListItem = {
  registrationId: string;
  fullName: string;
  age: number;
  educationLevel: string;
  totalFamilyMembers: number;
  registrationStatus: RegistrationStatus;
  paymentStatus: PaymentStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type DashboardMetric = {
  id: string;
  title: string;
  value: number | null;
  helperText?: string;
};
