import { useLanguage } from "../../language/LanguageContext";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  getEducationLabel,
  getFamilyCountTotal,
  getRequiredProgress
} from "../utilities/registration-form.utils";

type RegistrationSummaryCardProps = {
  values: RegistrationFormInputValues;
};

function displayValue(value: string, fallback: string) {
  return value.trim() ? value : fallback;
}

export function RegistrationSummaryCard({ values }: RegistrationSummaryCardProps) {
  const { language, localized } = useLanguage();
  const familyTotal = getFamilyCountTotal(values);
  const progress = getRequiredProgress(values);
  const educationLabel = getEducationLabel(values.educationLevel, language);
  const notEntered = localized("अभी दर्ज नहीं", "Not entered yet");

  return (
    <aside className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-soft lg:sticky lg:top-24">
      <h2 className="text-xl font-bold text-maroon-900">{localized("पंजीकरण सारांश", "Registration summary")}</h2>
      <p className="mt-2 text-sm leading-7 text-brown-700">
        {localized(
          "यह सारांश केवल आपके द्वारा भरी गई जानकारी की समीक्षा के लिए है।",
          "This summary is only for reviewing the information you have entered."
        )}
      </p>
      <div className="mt-5 rounded-lg border border-saffron-500/25 bg-saffron-50 p-4">
        <p className="text-sm font-semibold text-brown-700">
          {localized("पूर्ण किए गए आवश्यक क्षेत्र", "Completed required fields")}
        </p>
        <p className="mt-1 text-2xl font-bold text-maroon-900">
          {progress.completed} / {progress.total}
        </p>
      </div>
      <dl className="mt-5 divide-y divide-maroon-700/10 text-sm">
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("नाम", "Name")}</dt>
          <dd className="mt-1 break-words text-maroon-900">
            {displayValue(values.fullName, notEntered)}
          </dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("उम्र", "Age")}</dt>
          <dd className="mt-1 text-maroon-900">{displayValue(values.age, notEntered)}</dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("शिक्षा स्तर", "Education level")}</dt>
          <dd className="mt-1 text-maroon-900">
            {educationLabel || localized("अभी चयनित नहीं", "Not selected yet")}
          </dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("कुल परिवार सदस्य", "Total family members")}</dt>
          <dd className="mt-1 text-maroon-900">{familyTotal}</dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("फोटो स्थिति", "Photo status")}</dt>
          <dd className="mt-1 text-maroon-900">
            {values.applicantPhoto
              ? localized("फोटो चयनित", "Photo selected")
              : localized("फोटो चयनित नहीं", "Photo not selected")}
          </dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("घोषणा", "Declaration")}</dt>
          <dd className="mt-1 text-maroon-900">
            {values.declarationAccepted
              ? localized("स्वीकार की गई", "Accepted")
              : localized("स्वीकार नहीं की गई", "Not accepted")}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
