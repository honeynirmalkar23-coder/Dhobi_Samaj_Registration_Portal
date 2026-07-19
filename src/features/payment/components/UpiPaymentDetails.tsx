import { Copy, ExternalLink } from "lucide-react";
import { OutlineButton, SecondaryButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import { useClipboard } from "../../../hooks/useClipboard";
import { buildUpiDeepLink, isValidUpiId } from "../utilities/upi.utils";
import type { PublicPaymentSettings } from "../types/payment.types";

type UpiPaymentDetailsProps = {
  settings: PublicPaymentSettings;
};

export function UpiPaymentDetails({ settings }: UpiPaymentDetailsProps) {
  const { localized } = useLanguage();
  const { copyText, hasCopied } = useClipboard();
  const upiDeepLink = buildUpiDeepLink(settings);
  const hasValidUpi = isValidUpiId(settings.upiId);

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-xl font-bold text-maroon-900">{localized("UPI विवरण", "UPI details")}</h2>
      <dl className="mt-4 divide-y divide-maroon-700/10 text-sm">
        <div className="py-3">
          <dt className="font-semibold text-brown-700">UPI ID</dt>
          <dd className="mt-1 break-words font-semibold text-maroon-900">
            {settings.upiId ?? localized("कॉन्फ़िगर नहीं", "Not configured")}
          </dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("प्राप्तकर्ता नाम", "Recipient name")}</dt>
          <dd className="mt-1 text-maroon-900">{settings.payeeName ?? localized("कॉन्फ़िगर नहीं", "Not configured")}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <SecondaryButton
          disabled={!hasValidUpi || !settings.upiId}
          onClick={() => settings.upiId && void copyText(settings.upiId)}
        >
          <Copy aria-hidden="true" className="h-5 w-5" />
          {localized("UPI ID कॉपी करें", "Copy UPI ID")}
        </SecondaryButton>
        {upiDeepLink ? (
          <a
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-maroon-700/30 bg-white px-5 py-2.5 text-center text-sm font-semibold text-maroon-800 transition-colors hover:border-maroon-700 hover:bg-maroon-50 active:bg-maroon-100 sm:text-base"
            href={upiDeepLink}
          >
            <ExternalLink aria-hidden="true" className="h-5 w-5" />
            {localized("UPI ऐप खोलें", "Open UPI app")}
          </a>
        ) : (
          <OutlineButton disabled>
            <ExternalLink aria-hidden="true" className="h-5 w-5" />
            {localized("UPI ऐप खोलें", "Open UPI app")}
          </OutlineButton>
        )}
      </div>
      {hasCopied ? (
        <p className="mt-3 text-sm font-semibold text-communityGreen-700" role="status">
          {localized("UPI ID कॉपी हो गई।", "UPI ID copied.")}
        </p>
      ) : null}
      {!hasValidUpi ? (
        <p className="mt-3 text-sm leading-7 text-brown-700">
          {localized(
            "मान्य UPI ID सुरक्षित प्रशासनिक सेटिंग्स से उपलब्ध होने पर कॉपी और UPI लिंक सक्रिय होंगे।",
            "Copy and UPI link actions will be active when a valid UPI ID is available from secure administrative settings."
          )}
        </p>
      ) : null}
    </section>
  );
}
