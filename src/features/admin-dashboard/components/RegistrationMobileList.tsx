import { Link } from "react-router-dom";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { routeBuilders } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { formatPublicDate } from "../../../lib/utilities/dates";
import type { AdminRegistrationListItem } from "../types/admin-dashboard.types";

type RegistrationMobileListProps = {
  rows: AdminRegistrationListItem[];
};

export function RegistrationMobileList({ rows }: RegistrationMobileListProps) {
  const { localized } = useLanguage();

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <article className="rounded-lg border border-maroon-700/10 bg-white p-4 shadow-subtle" key={row.registrationId}>
          <h3 className="break-words text-lg font-bold text-maroon-900">{row.registrationId}</h3>
          <dl className="mt-3 space-y-2 text-sm leading-7 text-brown-800">
            <div><dt className="font-semibold">{localized("नाम", "Name")}</dt><dd>{row.fullName}</dd></div>
            <div><dt className="font-semibold">{localized("उम्र", "Age")}</dt><dd>{row.age}</dd></div>
            <div><dt className="font-semibold">{localized("शिक्षा", "Education")}</dt><dd>{row.educationLevel}</dd></div>
            <div><dt className="font-semibold">{localized("कुल परिवार सदस्य", "Total family members")}</dt><dd>{row.totalFamilyMembers}</dd></div>
            <div><dt className="font-semibold">{localized("जमा करने की तारीख", "Submission date")}</dt><dd>{formatPublicDate(row.submittedAt)}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={row.registrationStatus} type="registration" />
            <StatusBadge status={row.paymentStatus} type="payment" />
          </div>
          <Link
            className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-md border border-maroon-700/30 bg-white px-4 py-2 text-sm font-semibold text-maroon-800 hover:bg-maroon-50"
            to={routeBuilders.adminRegistrationDetail(row.registrationId)}
          >
            {localized("विवरण देखें", "View details")}
          </Link>
        </article>
      ))}
    </div>
  );
}
