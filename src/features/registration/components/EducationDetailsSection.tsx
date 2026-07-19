import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { educationLevelOptions } from "../../../config/education-options.config";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  normalizeEducationDetails,
  registrationFieldIds
} from "../utilities/registration-form.utils";
import { RegistrationSection } from "./RegistrationSection";

const inputClasses =
  "focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-white px-3 py-2.5 text-brown-900 placeholder:text-brown-700/55";

export function EducationDetailsSection() {
  const { language, localized } = useLanguage();
  const {
    clearErrors,
    formState: { errors },
    register,
    setValue
  } = useFormContext<RegistrationFormInputValues>();
  const educationLevel = useWatch<RegistrationFormInputValues>({
    name: "educationLevel"
  });
  const isOtherEducation = educationLevel === "other";

  useEffect(() => {
    if (!isOtherEducation) {
      clearErrors("educationDetails");
    }
  }, [clearErrors, isOtherEducation]);

  return (
    <RegistrationSection
      description={localized(
        "सदस्य ने कितनी पढ़ाई की है, इसकी जानकारी दर्ज करें।",
        "Enter the member's education information."
      )}
      title={localized("शैक्षणिक जानकारी", "Education information")}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.educationLevel?.message}
          id={registrationFieldIds.educationLevel}
          label={localized("शिक्षा स्तर", "Education level")}
          required
        >
          <select
            aria-describedby={errors.educationLevel ? `${registrationFieldIds.educationLevel}-error` : undefined}
            aria-invalid={Boolean(errors.educationLevel)}
            className={inputClasses}
            id={registrationFieldIds.educationLevel}
            {...register("educationLevel")}
          >
            <option value="">{localized("शिक्षा स्तर चुनें", "Select education level")}</option>
            {educationLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {language === "en" ? option.labelEn : option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          error={errors.educationDetails?.message}
          hint={localized(
            "चयनित शिक्षा के बारे में अतिरिक्त जानकारी दर्ज करें।",
            "Enter additional details about the selected education level."
          )}
          id={registrationFieldIds.educationDetails}
          label={localized("कक्षा / डिग्री / विषय", "Class / degree / subject")}
          required={isOtherEducation}
        >
          <input
            aria-describedby={cn(
              `${registrationFieldIds.educationDetails}-hint`,
              errors.educationDetails && `${registrationFieldIds.educationDetails}-error`
            )}
            aria-invalid={Boolean(errors.educationDetails)}
            className={inputClasses}
            id={registrationFieldIds.educationDetails}
            placeholder={localized(
              "उदाहरण: कक्षा 12वीं, बी.ए., बी.टेक., एम.ए.",
              "Example: Class 12, BA, B.Tech, MA"
            )}
            type="text"
            {...register("educationDetails", {
              onBlur: (event) => {
                setValue("educationDetails", normalizeEducationDetails(event.currentTarget.value), {
                  shouldDirty: true,
                  shouldValidate: isOtherEducation
                });
              }
            })}
          />
        </FormField>
      </div>
    </RegistrationSection>
  );
}
