import type { FieldErrors } from "react-hook-form";
import type { EducationLevelValue } from "../../../config/education-options.config";

export type RegistrationFormInputValues = {
  fullName: string;
  age: string;
  educationLevel: "" | EducationLevelValue;
  educationDetails: string;
  permanentAddress: string;
  boysCount: string;
  girlsCount: string;
  eldersCount: string;
  applicantPhoto: File | null;
  declarationAccepted: boolean;
};

export type RegistrationFormValues = {
  fullName: string;
  age: number;
  educationLevel: EducationLevelValue;
  educationDetails?: string;
  permanentAddress: string;
  boysCount: number;
  girlsCount: number;
  eldersCount: number;
  applicantPhoto: File;
  declarationAccepted: true;
};

export type RegistrationFormFieldName = keyof RegistrationFormInputValues;

export type RegistrationFormErrors = FieldErrors<RegistrationFormInputValues>;

export type RequiredProgress = {
  completed: number;
  total: number;
};
