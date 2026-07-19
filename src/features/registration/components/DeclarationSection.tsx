import { useFormContext } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import { registrationFieldIds } from "../utilities/registration-form.utils";
import { RegistrationSection } from "./RegistrationSection";

export function DeclarationSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register
  } = useFormContext<RegistrationFormInputValues>();

  return (
    <RegistrationSection
      description={localized(
        "पंजीकरण आगे बढ़ाने से पहले कृपया घोषणा पढ़कर स्वीकार करें।",
        "Please read and accept the declaration before continuing registration."
      )}
      title={localized("घोषणा", "Declaration")}
    >
      <label
        className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-saffron-500 flex cursor-pointer gap-3 rounded-lg border border-maroon-700/10 bg-cream-50 p-4 text-sm leading-7 text-brown-800"
        htmlFor={registrationFieldIds.declarationAccepted}
      >
        <input
          aria-describedby={
            errors.declarationAccepted
              ? `${registrationFieldIds.declarationAccepted}-error`
              : undefined
          }
          aria-invalid={Boolean(errors.declarationAccepted)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-maroon-700/30 text-maroon-700 focus:ring-saffron-500"
          id={registrationFieldIds.declarationAccepted}
          type="checkbox"
          {...register("declarationAccepted")}
        />
        <span>
          {localized(
            "मैं पुष्टि करता/करती हूं कि मेरे द्वारा दी गई जानकारी मेरी जानकारी के अनुसार सही है और पंजीकरण तथा प्रशासनिक सत्यापन के उद्देश्य से सुरक्षित रूप से संग्रहीत की जा सकती है।",
            "I confirm that the information provided by me is correct to the best of my knowledge and may be stored securely for registration and administrative verification."
          )}
          <span className="font-bold text-maroon-700"> *</span>
        </span>
      </label>
      {errors.declarationAccepted?.message ? (
        <p
          className="mt-3 text-sm font-semibold leading-7 text-maroon-700"
          id={`${registrationFieldIds.declarationAccepted}-error`}
          role="alert"
        >
          {errors.declarationAccepted.message}
        </p>
      ) : null}
    </RegistrationSection>
  );
}
