import { Home, RotateCcw, ServerOff, UserPlus } from "lucide-react";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../../components/common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";

type StatusLookupUnavailableProps = {
  registrationId: string;
  onReset: () => void;
};

export function StatusLookupUnavailable({ registrationId, onReset }: StatusLookupUnavailableProps) {
  const { localized } = useLanguage();

  return (
    <section
      aria-labelledby="status-unavailable-title"
      aria-live="polite"
      className="rounded-lg border border-saffron-500/25 bg-white p-5 shadow-soft sm:p-6"
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-maroon-800">
          <ServerOff aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-maroon-900" id="status-unavailable-title">
            {localized("स्थिति खोज सेवा अभी उपलब्ध नहीं है", "Status search service is not available yet")}
          </h2>
          <p className="mt-3 text-base leading-8 text-brown-700">
            {localized(
              "पंजीकरण स्थिति की सुरक्षित खोज, सीमित सार्वजनिक जानकारी और भुगतान सत्यापन की वास्तविक स्थिति बैकएंड चरण में जोड़ी जाएगी।",
              "Secure registration-status search, limited public information and real payment-verification status will be added in the backend stage."
            )}
          </p>
          <dl className="mt-5 rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
            <dt className="text-sm font-semibold text-brown-700">{localized("मान्य पंजीकरण आईडी", "Valid registration ID")}</dt>
            <dd className="mt-1 break-words text-lg font-bold text-maroon-900">
              {registrationId}
            </dd>
          </dl>
          <div className="mt-4 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 p-4 text-sm leading-7 text-brown-800">
            <p>
              {localized(
                "पंजीकरण आईडी का प्रारूप मान्य है, लेकिन अभी किसी वास्तविक रिकॉर्ड की खोज नहीं की गई है।",
                "The registration ID format is valid, but no real record search has been performed yet."
              )}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>{localized("पंजीकरण आईडी का प्रारूप मान्य है।", "The registration ID format is valid.")}</li>
              <li>{localized("कोई डेटाबेस खोज नहीं हुई।", "No database search was performed.")}</li>
              <li>{localized("कोई पंजीकरण रिकॉर्ड पुष्टि नहीं हुआ।", "No registration record was confirmed.")}</li>
              <li>{localized("कोई परिणाम बनाया या अनुमानित नहीं किया गया।", "No result was created or inferred.")}</li>
              <li>{localized("कोई व्यक्तिगत जानकारी प्राप्त नहीं की गई।", "No personal information was retrieved.")}</li>
            </ul>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryButton onClick={onReset}>
              <RotateCcw aria-hidden="true" className="h-5 w-5" />
              {localized("नई खोज करें", "New search")}
            </PrimaryButton>
            <SecondaryButton to={routePaths.home}>
              <Home aria-hidden="true" className="h-5 w-5" />
              {localized("होम पेज पर जाएं", "Go to home page")}
            </SecondaryButton>
            <OutlineButton to={routePaths.registration}>
              <UserPlus aria-hidden="true" className="h-5 w-5" />
              {localized("नया पंजीकरण करें", "Start new registration")}
            </OutlineButton>
          </div>
        </div>
      </div>
    </section>
  );
}
