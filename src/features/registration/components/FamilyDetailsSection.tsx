import { useFormContext, useWatch } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import { getFamilyCountTotal } from "../utilities/registration-form.utils";
import { FamilyCountField } from "./FamilyCountField";
import { RegistrationSection } from "./RegistrationSection";

export function FamilyDetailsSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors }
  } = useFormContext<RegistrationFormInputValues>();
  const counts = useWatch<RegistrationFormInputValues>({
    name: ["boysCount", "girlsCount", "eldersCount"]
  });
  const total = getFamilyCountTotal({
    boysCount: String(counts?.[0] ?? "0"),
    girlsCount: String(counts?.[1] ?? "0"),
    eldersCount: String(counts?.[2] ?? "0")
  });

  return (
    <RegistrationSection
      description={localized(
        "परिवार में लड़कों, लड़कियों और बुजुर्गों की संख्या दर्ज करें।",
        "Enter the number of boys, girls and elders in the family."
      )}
      title={localized("परिवार की जनसंख्या", "Family population")}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <FamilyCountField
          decrementLabel={localized("लड़कों की संख्या घटाएं", "Decrease boys count")}
          error={errors.boysCount?.message}
          incrementLabel={localized("लड़कों की संख्या बढ़ाएं", "Increase boys count")}
          label={localized("लड़कों की संख्या", "Number of boys")}
          name="boysCount"
        />
        <FamilyCountField
          decrementLabel={localized("लड़कियों की संख्या घटाएं", "Decrease girls count")}
          error={errors.girlsCount?.message}
          incrementLabel={localized("लड़कियों की संख्या बढ़ाएं", "Increase girls count")}
          label={localized("लड़कियों की संख्या", "Number of girls")}
          name="girlsCount"
        />
        <FamilyCountField
          decrementLabel={localized("बुजुर्गों की संख्या घटाएं", "Decrease elders count")}
          error={errors.eldersCount?.message}
          incrementLabel={localized("बुजुर्गों की संख्या बढ़ाएं", "Increase elders count")}
          label={localized("बुजुर्गों की संख्या", "Number of elders")}
          name="eldersCount"
        />
      </div>
      <div
        aria-live="polite"
        className="mt-6 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 p-4"
      >
        <p className="text-sm font-semibold text-communityGreen-700">
          {localized("कुल दर्ज परिवार सदस्य", "Total family members entered")}
        </p>
        <p className="mt-1 text-3xl font-bold text-maroon-900">{total}</p>
        <p className="mt-2 text-sm leading-7 text-brown-700">
          {localized(
            "यह कुल केवल ऊपर दर्ज लड़कों, लड़कियों और बुजुर्गों की संख्या का योग है।",
            "This total is only the sum of boys, girls and elders entered above."
          )}
        </p>
      </div>
    </RegistrationSection>
  );
}
