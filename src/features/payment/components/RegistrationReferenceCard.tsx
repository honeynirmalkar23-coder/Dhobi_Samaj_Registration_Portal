import { Copy } from "lucide-react";
import { SecondaryButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import { useClipboard } from "../../../hooks/useClipboard";

type RegistrationReferenceCardProps = {
  registrationId: string;
};

export function RegistrationReferenceCard({ registrationId }: RegistrationReferenceCardProps) {
  const { localized } = useLanguage();
  const { copyText, hasCopied } = useClipboard();

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-xl font-bold text-maroon-900">{localized("पंजीकरण संदर्भ", "Registration reference")}</h2>
      <dl className="mt-4 space-y-2">
        <dt className="text-sm font-semibold text-brown-700">{localized("पंजीकरण आईडी", "Registration ID")}</dt>
        <dd className="break-words rounded-md border border-maroon-700/10 bg-cream-50 px-3 py-2 font-semibold text-maroon-900">
          {registrationId}
        </dd>
      </dl>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SecondaryButton
          aria-label={localized("पंजीकरण आईडी कॉपी करें", "Copy registration ID")}
          onClick={() => void copyText(registrationId)}
        >
          <Copy aria-hidden="true" className="h-5 w-5" />
          {localized("पंजीकरण आईडी कॉपी करें", "Copy registration ID")}
        </SecondaryButton>
        {hasCopied ? (
          <p className="text-sm font-semibold text-communityGreen-700" role="status">
            {localized("पंजीकरण आईडी कॉपी हो गई।", "Registration ID copied.")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
