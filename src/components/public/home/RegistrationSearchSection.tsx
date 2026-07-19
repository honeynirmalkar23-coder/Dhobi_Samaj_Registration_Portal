import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchInput } from "../../common/SearchInput";
import { SectionContainer } from "../../common/SectionContainer";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../../features/language/LanguageContext";
import {
  getRegistrationIdValidationError,
  normalizeRegistrationId,
  registrationIdFormat
} from "../../../lib/validation/registration-id";

export function RegistrationSearchSection() {
  const [registrationId, setRegistrationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { copy, language } = useLanguage();

  const handleSubmit = (value: string) => {
    const normalizedValue = normalizeRegistrationId(value);
    setRegistrationId(normalizedValue);

    const validationError = getRegistrationIdValidationError(normalizedValue);
    setError(validationError ? (language === "en" ? copy.home.search.invalidId : validationError) : null);

    if (validationError) {
      return;
    }

    const searchParams = new URLSearchParams({
      registrationId: normalizedValue
    });
    navigate(`${routePaths.status}?${searchParams.toString()}`);
  };

  return (
    <section className="bg-cream-100 py-8 sm:py-10">
      <div className="page-shell">
        <SectionContainer
          className="mx-auto max-w-4xl"
          description={copy.home.search.description}
          title={copy.home.search.title}
          variant="card"
        >
          <SearchInput
            buttonLabel={copy.home.search.button}
            error={error}
            helperText={`${copy.home.search.helperPrefix} ${registrationIdFormat}${copy.home.search.helperSuffix ? ` ${copy.home.search.helperSuffix}` : ""}`}
            id="home-registration-search"
            label={copy.home.search.label}
            onChange={(value) => {
              setRegistrationId(value);
              if (error) {
                setError(null);
              }
            }}
            onSubmit={handleSubmit}
            placeholder={copy.home.search.placeholder}
            privacyNote={copy.home.search.privacyNote}
            value={registrationId}
          />
        </SectionContainer>
      </div>
    </section>
  );
}
