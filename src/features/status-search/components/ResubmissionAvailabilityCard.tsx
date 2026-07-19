import { LockKeyhole, RotateCcw, ServerOff, UploadCloud } from "lucide-react";
import { OutlineButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import type { ResubmissionAvailabilityState } from "../types/status-search.types";

type ResubmissionAvailabilityCardProps = {
  paymentResubmissionAllowed: boolean;
  state?: ResubmissionAvailabilityState;
  paymentRetryUrl?: string | null;
};

export function ResubmissionAvailabilityCard({
  paymentResubmissionAllowed,
  paymentRetryUrl = null,
  state = paymentResubmissionAllowed ? "allowed" : "not_allowed"
}: ResubmissionAvailabilityCardProps) {
  const { localized } = useLanguage();

  if (state === "backend_unavailable") {
    return (
      <section className="rounded-lg border border-saffron-500/25 bg-saffron-50 p-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-maroon-900">
          <ServerOff aria-hidden="true" className="h-5 w-5" />
          {localized("पुनः जमा करने की स्थिति", "Resubmission status")}
        </h3>
        <p className="mt-2 text-sm leading-7 text-brown-800">
          {localized(
            "भुगतान प्रमाण दोबारा जमा करने की अनुमति बैकएंड चरण में सुरक्षित रूप से जांची जाएगी।",
            "Permission to resubmit payment proof will be checked securely in the backend stage."
          )}
        </p>
      </section>
    );
  }

  if (state === "already_submitted") {
    return (
      <section className="rounded-lg border border-communityGreen-600/25 bg-communityGreen-50 p-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-communityGreen-700">
          <UploadCloud aria-hidden="true" className="h-5 w-5" />
          {localized("भुगतान प्रमाण जमा है", "Payment proof is submitted")}
        </h3>
        <p className="mt-2 text-sm leading-7 text-brown-800">
          {localized(
            "नया भुगतान प्रमाण पहले ही समीक्षा के लिए जमा किया गया है।",
            "A new payment proof has already been submitted for review."
          )}
        </p>
      </section>
    );
  }

  if (state === "allowed" && paymentResubmissionAllowed) {
    return (
      <section className="rounded-lg border border-saffron-500/25 bg-white p-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-maroon-900">
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
          {localized("पुनः जमा करने की अनुमति", "Resubmission permission")}
        </h3>
        <p className="mt-2 text-sm leading-7 text-brown-800">
          {localized(
            "अनुमति स्पष्ट रूप से उपलब्ध होने पर ही नया भुगतान प्रमाण स्वीकार किया जाएगा।",
            "New payment proof will be accepted only when permission is explicitly available."
          )}
        </p>
        <div className="mt-4">
          {paymentRetryUrl ? (
            <OutlineButton to={paymentRetryUrl}>{localized("नया भुगतान प्रमाण जमा करें", "Submit new payment proof")}</OutlineButton>
          ) : (
            <OutlineButton disabled>{localized("नया भुगतान प्रमाण जमा करें", "Submit new payment proof")}</OutlineButton>
          )}
        </div>
        {!paymentRetryUrl ? (
          <p className="mt-3 text-sm leading-7 text-brown-700">
            {localized(
              "इस ब्राउज़र सत्र में भुगतान टोकन उपलब्ध नहीं है। कृपया प्रशासन से संपर्क करें।",
              "The payment token is not available in this browser session. Please contact administration."
            )}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
      <h3 className="flex items-center gap-2 text-base font-bold text-maroon-900">
        <LockKeyhole aria-hidden="true" className="h-5 w-5" />
        {localized("पुनः जमा करना उपलब्ध नहीं", "Resubmission is not available")}
      </h3>
      <p className="mt-2 text-sm leading-7 text-brown-800">
        {localized(
          "केवल भुगतान स्थिति देखकर नया प्रमाण जमा करने की अनुमति नहीं दी जाती। अनुमति अलग से सुरक्षित रिकॉर्ड से आएगी।",
          "New proof submission is not allowed only by looking at payment status. Permission comes from a separate secure record."
        )}
      </p>
    </section>
  );
}
