import { useLanguage } from "../../language/LanguageContext";
import type { RegistrationFormErrors } from "../types/registration-form.types";
import {
  registrationFieldIds,
  registrationFieldLabels
} from "../utilities/registration-form.utils";

type FormErrorSummaryProps = {
  errors: RegistrationFormErrors;
};

const registrationFieldLabelsEn = {
  fullName: "Name",
  age: "Age",
  mobileNumber: "Mobile number",
  educationLevel: "Education level",
  educationDetails: "Class / degree / subject",
  permanentAddress: "Permanent address",
  boysCount: "Number of boys",
  girlsCount: "Number of girls",
  eldersCount: "Number of elders",
  applicantPhoto: "Upload photo",
  declarationAccepted: "Declaration"
} as const satisfies Record<keyof typeof registrationFieldLabels, string>;

export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const { language, localized } = useLanguage();
  const entries = Object.keys(errors)
    .filter((fieldName) => fieldName in registrationFieldLabels)
    .map((fieldName) => fieldName as keyof typeof registrationFieldLabels);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="registration-error-summary-title"
      className="rounded-lg border border-maroon-700/25 bg-maroon-50 p-4 text-maroon-900"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="text-lg font-bold" id="registration-error-summary-title">
        {localized("कृपया निम्न जानकारी जांचें", "Please check the following information")}
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-7">
        {entries.map((fieldName) => (
          <li key={fieldName}>
            <button
              className="focus-ring rounded-md text-left font-semibold underline-offset-4 hover:underline"
              onClick={() => {
                document.getElementById(registrationFieldIds[fieldName])?.focus();
              }}
              type="button"
            >
              {language === "en" ? registrationFieldLabelsEn[fieldName] : registrationFieldLabels[fieldName]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
