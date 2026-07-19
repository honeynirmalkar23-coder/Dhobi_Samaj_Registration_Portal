import { useFormContext } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  blockInvalidNumberKey,
  normalizeFullName,
  registrationFieldIds
} from "../utilities/registration-form.utils";
import { RegistrationSection } from "./RegistrationSection";

const inputClasses =
  "focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-white px-3 py-2.5 text-brown-900 placeholder:text-brown-700/55";

export function PersonalDetailsSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register,
    setValue
  } = useFormContext<RegistrationFormInputValues>();

  return (
    <RegistrationSection
      description={localized("सदस्य का नाम और आयु दर्ज करें।", "Enter the member's name and age.")}
      title={localized("व्यक्तिगत जानकारी", "Personal information")}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.fullName?.message}
          hint={localized("नाम हिंदी या अंग्रेजी में दर्ज किया जा सकता है।", "Name may be entered in Hindi or English.")}
          id={registrationFieldIds.fullName}
          label={localized("नाम", "Name")}
          required
        >
          <input
            aria-describedby={cn(
              `${registrationFieldIds.fullName}-hint`,
              errors.fullName && `${registrationFieldIds.fullName}-error`
            )}
            aria-invalid={Boolean(errors.fullName)}
            className={inputClasses}
            id={registrationFieldIds.fullName}
            placeholder={localized("सदस्य का पूरा नाम दर्ज करें", "Enter the member's full name")}
            type="text"
            {...register("fullName", {
              onBlur: (event) => {
                setValue("fullName", normalizeFullName(event.currentTarget.value), {
                  shouldDirty: true,
                  shouldValidate: true
                });
              }
            })}
          />
        </FormField>

        <FormField
          error={errors.age?.message}
          hint={localized("उम्र पूर्ण वर्षों में दर्ज करें।", "Enter age in completed years.")}
          id={registrationFieldIds.age}
          label={localized("उम्र", "Age")}
          required
        >
          <input
            aria-describedby={cn(
              `${registrationFieldIds.age}-hint`,
              errors.age && `${registrationFieldIds.age}-error`
            )}
            aria-invalid={Boolean(errors.age)}
            className={inputClasses}
            id={registrationFieldIds.age}
            inputMode="numeric"
            min={1}
            onKeyDown={blockInvalidNumberKey}
            placeholder={localized("उदाहरण: 35", "Example: 35")}
            type="number"
            {...register("age")}
          />
        </FormField>
      </div>
    </RegistrationSection>
  );
}
