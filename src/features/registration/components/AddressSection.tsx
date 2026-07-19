import { useFormContext, useWatch } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  normalizePermanentAddress,
  registrationFieldIds
} from "../utilities/registration-form.utils";
import { RegistrationSection } from "./RegistrationSection";

const textareaClasses =
  "focus-ring min-h-36 w-full resize-y rounded-md border border-maroon-700/20 bg-white px-3 py-2.5 text-brown-900 placeholder:text-brown-700/55";

export function AddressSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register,
    setValue
  } = useFormContext<RegistrationFormInputValues>();
  const permanentAddress = useWatch<RegistrationFormInputValues>({
    name: "permanentAddress"
  });
  const characterCount = String(permanentAddress ?? "").length;

  return (
    <RegistrationSection
      description={localized("सदस्य का पूरा स्थायी पता दर्ज करें।", "Enter the member's full permanent address.")}
      title={localized("स्थायी पता", "Permanent address")}
    >
      <FormField
        error={errors.permanentAddress?.message}
        hint={localized(
          "कृपया ऐसा पता दर्ज करें जिससे प्रशासन आवश्यकता होने पर संपर्क या सत्यापन कर सके।",
          "Enter an address that administration can use for contact or verification if needed."
        )}
        id={registrationFieldIds.permanentAddress}
        label={localized("स्थायी पता", "Permanent address")}
        required
      >
        <textarea
          aria-describedby={cn(
            `${registrationFieldIds.permanentAddress}-hint`,
            `${registrationFieldIds.permanentAddress}-count`,
            errors.permanentAddress && `${registrationFieldIds.permanentAddress}-error`
          )}
          aria-invalid={Boolean(errors.permanentAddress)}
          className={textareaClasses}
          id={registrationFieldIds.permanentAddress}
          maxLength={520}
          placeholder={localized(
            "मकान/वार्ड, गांव या शहर, तहसील, जिला और राज्य सहित पूरा पता दर्ज करें",
            "Enter full address with house/ward, village or city, tehsil, district and state"
          )}
          {...register("permanentAddress", {
            onBlur: (event) => {
              setValue("permanentAddress", normalizePermanentAddress(event.currentTarget.value), {
                shouldDirty: true,
                shouldValidate: true
              });
            }
          })}
        />
        <p
          className="mt-2 text-right text-sm font-semibold text-brown-700"
          id={`${registrationFieldIds.permanentAddress}-count`}
        >
          {characterCount} / 500
        </p>
      </FormField>
    </RegistrationSection>
  );
}
