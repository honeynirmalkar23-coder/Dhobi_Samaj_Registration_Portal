import type { RegistrationFormInputValues } from "../features/registration/types/registration-form.types";
import { invokeEdgeFunction } from "./edge-functions.service";
import type { ServiceResult } from "./api.types";
import { dataBackendMode } from "./backend/backend-mode";

export type CreateRegistrationResult = {
  registrationId: string;
  paymentAccessToken: string;
  createdAt: string;
};

function appendRegistrationField(formData: FormData, name: string, value: string | number | boolean) {
  formData.append(name, String(value));
}

export function buildRegistrationFormData(values: RegistrationFormInputValues): FormData {
  const formData = new FormData();

  appendRegistrationField(formData, "fullName", values.fullName);
  appendRegistrationField(formData, "age", values.age);
  appendRegistrationField(formData, "mobileNumber", values.mobileNumber);
  appendRegistrationField(formData, "educationLevel", values.educationLevel);
  appendRegistrationField(formData, "educationDetails", values.educationDetails);
  appendRegistrationField(formData, "permanentAddress", values.permanentAddress);
  appendRegistrationField(formData, "boysCount", values.boysCount);
  appendRegistrationField(formData, "girlsCount", values.girlsCount);
  appendRegistrationField(formData, "eldersCount", values.eldersCount);
  appendRegistrationField(formData, "declarationAccepted", values.declarationAccepted);

  if (values.applicantPhoto) {
    formData.append("applicantPhoto", values.applicantPhoto);
  }

  return formData;
}

export async function createRegistration(
  values: RegistrationFormInputValues
): Promise<ServiceResult<CreateRegistrationResult>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { createLocalRegistration } = await import("./backend/local-portal.client");

    return createLocalRegistration(values);
  }

  return invokeEdgeFunction<CreateRegistrationResult>(
    "create-registration",
    buildRegistrationFormData(values)
  );
}
