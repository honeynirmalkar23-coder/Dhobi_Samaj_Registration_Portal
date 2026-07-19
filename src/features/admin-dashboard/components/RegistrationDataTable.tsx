import { Link } from "react-router-dom";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { routeBuilders } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { formatPublicDate } from "../../../lib/utilities/dates";
import type { AdminRegistrationListItem } from "../types/admin-dashboard.types";

type RegistrationDataTableProps = {
  rows: AdminRegistrationListItem[];
};

export function RegistrationDataTable({ rows }: RegistrationDataTableProps) {
  const { localized } = useLanguage();

  return (
    <div className="overflow-x-auto rounded-lg border border-maroon-700/10 bg-white shadow-subtle">
      <table className="min-w-full divide-y divide-maroon-700/10 text-sm">
        <thead className="bg-cream-50 text-left text-brown-800">
          <tr>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("पंजीकरण आईडी", "Registration ID")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("नाम", "Name")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("उम्र", "Age")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("शिक्षा", "Education")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("कुल परिवार सदस्य", "Total family members")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("पंजीकरण स्थिति", "Registration status")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("भुगतान स्थिति", "Payment status")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("जमा करने की तारीख", "Submission date")}</th>
            <th className="px-4 py-3 font-semibold" scope="col">{localized("कार्रवाई", "Action")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-maroon-700/10">
          {rows.map((row) => (
            <tr key={row.registrationId}>
              <td className="break-words px-4 py-3 font-semibold text-maroon-900">{row.registrationId}</td>
              <td className="px-4 py-3 text-brown-800">{row.fullName}</td>
              <td className="px-4 py-3 text-brown-800">{row.age}</td>
              <td className="px-4 py-3 text-brown-800">{row.educationLevel}</td>
              <td className="px-4 py-3 text-brown-800">{row.totalFamilyMembers}</td>
              <td className="px-4 py-3"><StatusBadge status={row.registrationStatus} type="registration" /></td>
              <td className="px-4 py-3"><StatusBadge status={row.paymentStatus} type="payment" /></td>
              <td className="px-4 py-3 text-brown-800">{formatPublicDate(row.submittedAt)}</td>
              <td className="px-4 py-3">
                <Link
                  className="focus-ring rounded-md font-semibold text-maroon-800 underline-offset-4 hover:underline"
                  to={routeBuilders.adminRegistrationDetail(row.registrationId)}
                >
                  {localized("विवरण देखें", "View details")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
