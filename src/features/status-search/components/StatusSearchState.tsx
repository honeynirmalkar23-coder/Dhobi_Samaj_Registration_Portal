import { Loader2, SearchX } from "lucide-react";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../../components/common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import type {
  PublicRegistrationStatus,
  StatusSearchViewState
} from "../types/status-search.types";
import { RegistrationStatusResultCard } from "./RegistrationStatusResultCard";
import { StatusLookupUnavailable } from "./StatusLookupUnavailable";

type StatusSearchStateProps = {
  state: StatusSearchViewState;
  searchedRegistrationId: string | null;
  result?: PublicRegistrationStatus | null;
  onReset: () => void;
  onRetry?: () => void;
};

function StateActions({ onReset }: { onReset: () => void }) {
  const { localized } = useLanguage();

  return (
    <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
      <PrimaryButton onClick={onReset}>{localized("नई खोज करें", "New search")}</PrimaryButton>
      <SecondaryButton to={routePaths.registration}>{localized("नया पंजीकरण करें", "Start new registration")}</SecondaryButton>
      <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
    </div>
  );
}

export function StatusSearchState({
  state,
  searchedRegistrationId,
  result,
  onReset,
  onRetry
}: StatusSearchStateProps) {
  const { localized } = useLanguage();

  if (state === "idle" || state === "invalid") {
    return (
      <EmptyState
        className="bg-white"
        description={localized(
          "पंजीकरण आईडी दर्ज करें और सीमित सार्वजनिक स्थिति जानकारी देखें।",
          "Enter a registration ID to view limited public status information."
        )}
        icon={SearchX}
        title={localized("स्थिति खोज के लिए पंजीकरण आईडी दर्ज करें", "Enter registration ID to search status")}
      />
    );
  }

  if (state === "backend_unavailable" && searchedRegistrationId) {
    return (
      <StatusLookupUnavailable
        onReset={onReset}
        registrationId={searchedRegistrationId}
      />
    );
  }

  if (state === "loading") {
    return (
      <section
        aria-live="polite"
        className="flex flex-col items-center justify-center rounded-lg border border-maroon-700/10 bg-white px-4 py-10 text-center shadow-subtle"
        role="status"
      >
        <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-maroon-700" />
        <h2 className="mt-4 text-xl font-bold text-maroon-900">
          {localized("पंजीकरण स्थिति खोजी जा रही है…", "Searching registration status…")}
        </h2>
      </section>
    );
  }

  if (state === "not_found") {
    return (
      <EmptyState
        action={<StateActions onReset={onReset} />}
        className="bg-white"
        description={localized(
          "दर्ज की गई पंजीकरण आईडी से कोई सार्वजनिक रिकॉर्ड नहीं मिला। कृपया आईडी जांचें और दोबारा प्रयास करें।",
          "No public record was found for the entered registration ID. Please check the ID and try again."
        )}
        icon={SearchX}
        title={localized("पंजीकरण रिकॉर्ड नहीं मिला", "Registration record not found")}
      />
    );
  }

  if (state === "found" && result) {
    return <RegistrationStatusResultCard status={result} />;
  }

  return (
    <ErrorState
      action={
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <PrimaryButton onClick={onRetry ?? onReset}>{localized("पुनः प्रयास करें", "Try again")}</PrimaryButton>
          <SecondaryButton onClick={onReset}>{localized("नई खोज करें", "New search")}</SecondaryButton>
          <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
        </div>
      }
      className="bg-white"
      description={localized(
        "अभी पंजीकरण स्थिति प्राप्त करने में समस्या हुई। कृपया कुछ समय बाद पुनः प्रयास करें।",
        "There was a problem getting registration status right now. Please try again after some time."
      )}
      title={localized("स्थिति प्राप्त नहीं हो सकी", "Status could not be loaded")}
    />
  );
}
