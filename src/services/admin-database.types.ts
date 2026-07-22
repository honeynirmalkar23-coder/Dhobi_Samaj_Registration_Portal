import type { PaymentStatus } from "../types/status";

export type AdminRegistrationExportRow = {
  registrationId: string;
  fullName: string;
  mobileNumber: string | null;
  dob: string | null;
  age: number;
  education: string;
  address: string;
  boys: number;
  girls: number;
  elderly: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paymentUtr: string | null;
  paymentAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ExportClearDatabaseResult = {
  exportedRows: number;
  deletedRows: number;
  filename: string;
};
