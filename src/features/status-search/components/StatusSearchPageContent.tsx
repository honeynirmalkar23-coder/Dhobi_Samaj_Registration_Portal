import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { normalizeRegistrationId } from "../../../lib/validation/registration-id";
import { getPublicRegistrationStatus } from "../../../services/status-search.service";
import type { StatusSearchViewState } from "../types/status-search.types";
import type { PublicRegistrationStatus } from "../types/status-search.types";
import { PublicDataPrivacyNotice } from "./PublicDataPrivacyNotice";
import { RegistrationStatusSearchForm } from "./RegistrationStatusSearchForm";
import { StatusExplanationSection } from "./StatusExplanationSection";
import { StatusSearchState } from "./StatusSearchState";

type StatusSearchPageContentProps = {
  queryRegistrationId: string;
};

export function StatusSearchPageContent({ queryRegistrationId }: StatusSearchPageContentProps) {
  const { localized } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const initialRegistrationId = useMemo(
    () => normalizeRegistrationId(queryRegistrationId),
    [queryRegistrationId]
  );
  const [viewState, setViewState] = useState<StatusSearchViewState>("idle");
  const [searchedRegistrationId, setSearchedRegistrationId] = useState<string | null>(null);
  const [result, setResult] = useState<PublicRegistrationStatus | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const updateSearchUrl = (registrationId: string) => {
    const searchParams = new URLSearchParams({
      registrationId
    });
    const targetUrl = `${routePaths.status}?${searchParams.toString()}`;
    const currentUrl = `${location.pathname}${location.search}`;

    navigate(targetUrl, {
      replace: currentUrl === targetUrl
    });
  };

  const handleSearch = async (registrationId: string) => {
    setSearchedRegistrationId(registrationId);
    setResult(null);
    setViewState("loading");
    updateSearchUrl(registrationId);

    const searchResult = await getPublicRegistrationStatus(registrationId);

    if (!searchResult.ok) {
      setViewState(searchResult.code === "NOT_FOUND" ? "not_found" : "error");
      return;
    }

    setResult(searchResult.data);
    setViewState("found");
  };

  const handleInvalidSearch = () => {
    setSearchedRegistrationId(null);
    setViewState("invalid");
  };

  const handleReset = () => {
    setSearchedRegistrationId(null);
    setResult(null);
    setViewState("idle");
    setResetSignal((value) => value + 1);
    navigate(routePaths.status, {
      replace: true
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        description={localized(
          "अपनी पंजीकरण आईडी दर्ज करके पंजीकरण और भुगतान सत्यापन की वर्तमान स्थिति देखें।",
          "Enter your registration ID to view current registration and payment-verification status."
        )}
        eyebrow={localized("पंजीकरण ट्रैकिंग", "Registration tracking")}
        title={localized("पंजीकरण स्थिति खोजें", "Find registration status")}
      />

      <section
        aria-label={localized("गोपनीयता सूचना", "Privacy notice")}
        className="flex gap-3 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 px-4 py-3 text-sm leading-7 text-brown-800"
      >
        <ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        <p>
          {localized(
            "सार्वजनिक खोज में केवल सीमित स्थिति जानकारी दिखाई जाएगी। पूरा पता, फोटो, भुगतान स्क्रीनशॉट और प्रशासनिक टिप्पणी सार्वजनिक रूप से उपलब्ध नहीं होंगे।",
            "Public search will show only limited status information. Full address, photo, payment screenshot and administrative notes will not be publicly available."
          )}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <RegistrationStatusSearchForm
          hasSearchAttempt={viewState !== "idle"}
          initialRegistrationId={initialRegistrationId}
          onInvalidSearch={handleInvalidSearch}
          onReset={handleReset}
          onSearch={handleSearch}
          resetSignal={resetSignal}
        />

        <StatusSearchState
          onRetry={() => searchedRegistrationId && void handleSearch(searchedRegistrationId)}
          onReset={handleReset}
          result={result}
          searchedRegistrationId={searchedRegistrationId}
          state={viewState}
        />
      </div>

      <StatusExplanationSection />
      <PublicDataPrivacyNotice />
    </div>
  );
}
