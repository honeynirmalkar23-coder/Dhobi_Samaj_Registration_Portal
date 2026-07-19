import { CalendarDays, RefreshCw, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { routeBuilders } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { formatPublicDate } from "../../../lib/utilities/dates";
import { getPaymentAccessToken } from "../../../services/payment.service";
import { toPublicRegistrationStatus } from "../utilities/public-registration-mapper";
import type { PublicRegistrationStatus } from "../types/status-search.types";
import { PaymentRejectionGuidance } from "./PaymentRejectionGuidance";
import { RegistrationStatusTimeline } from "./RegistrationStatusTimeline";
import { ResubmissionAvailabilityCard } from "./ResubmissionAvailabilityCard";

type RegistrationStatusResultCardProps = {
  status: PublicRegistrationStatus;
};

export function RegistrationStatusResultCard({ status }: RegistrationStatusResultCardProps) {
  const { localized } = useLanguage();
  const publicStatus = toPublicRegistrationStatus(status);
  const hasPaymentToken = Boolean(getPaymentAccessToken(publicStatus.registrationId));

  return (
    <article className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-communityGreen-700">
            {localized("सार्वजनिक स्थिति परिणाम", "Public status result")}
          </p>
          <h2 className="mt-2 break-words text-2xl font-bold text-maroon-900">
            {publicStatus.registrationId}
          </h2>
        </div>
        <ShieldCheck aria-hidden="true" className="h-8 w-8 shrink-0 text-communityGreen-700" />
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
          <dt className="text-sm font-semibold text-brown-700">{localized("नाम", "Name")}</dt>
          <dd className="mt-1 break-words text-lg font-bold text-maroon-900">
            {publicStatus.maskedName}
          </dd>
        </div>
        <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
          <dt className="text-sm font-semibold text-brown-700">{localized("पंजीकरण स्थिति", "Registration status")}</dt>
          <dd className="mt-2">
            <StatusBadge status={publicStatus.registrationStatus} type="registration" />
          </dd>
        </div>
        <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
          <dt className="text-sm font-semibold text-brown-700">{localized("भुगतान स्थिति", "Payment status")}</dt>
          <dd className="mt-2">
            <StatusBadge status={publicStatus.paymentStatus} type="payment" />
          </dd>
        </div>
        <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
          <dt className="flex items-center gap-2 text-sm font-semibold text-brown-700">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {localized("पंजीकरण तारीख", "Registration date")}
          </dt>
          <dd className="mt-1 text-maroon-900">
            {formatPublicDate(publicStatus.registrationCreatedAt)}
          </dd>
        </div>
        <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4 md:col-span-2">
          <dt className="flex items-center gap-2 text-sm font-semibold text-brown-700">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            {localized("अंतिम अपडेट", "Last updated")}
          </dt>
          <dd className="mt-1 text-maroon-900">
            {formatPublicDate(publicStatus.lastUpdatedAt, { includeTime: true })}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RegistrationStatusTimeline registrationStatus={publicStatus.registrationStatus} />
        <ResubmissionAvailabilityCard
          paymentResubmissionAllowed={publicStatus.paymentResubmissionAllowed}
          paymentRetryUrl={
            publicStatus.paymentResubmissionAllowed && hasPaymentToken
              ? routeBuilders.paymentDetail(publicStatus.registrationId)
              : null
          }
        />
      </div>

      <div className="mt-4">
        <PaymentRejectionGuidance
          paymentResubmissionAllowed={publicStatus.paymentResubmissionAllowed}
          paymentStatus={publicStatus.paymentStatus}
          publicRejectionMessage={publicStatus.publicRejectionMessage}
        />
      </div>
    </article>
  );
}
