import { Settings } from "lucide-react";
import { OutlineButton } from "../../../components/common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useAdminAuth } from "../hooks/useAdminAuth";

export function AdminConfigurationRequired() {
  const { localized } = useLanguage();
  const { authenticationMode, missingConfigurationVariables } = useAdminAuth();
  const isLocalDevelopmentMode = authenticationMode === "local-dev";
  const variables = isLocalDevelopmentMode
    ? missingConfigurationVariables
    : ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  return (
    <section
      aria-labelledby="admin-config-required-title"
      className="mx-auto max-w-2xl rounded-lg border border-saffron-500/25 bg-white p-6 text-center shadow-soft"
      role="status"
    >
      <Settings aria-hidden="true" className="mx-auto h-10 w-10 text-maroon-700" />
      <h1 className="mt-4 text-2xl font-bold text-maroon-900" id="admin-config-required-title">
        {localized("प्रशासन लॉगिन कॉन्फ़िगरेशन आवश्यक है", "Admin login configuration is required")}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-brown-700">
        {isLocalDevelopmentMode
          ? localized(
              "स्थानीय विकास लॉगिन के लिए server-side environment variables कॉन्फ़िगर करें। इनके values browser में नहीं दिखाए जाएंगे।",
              "Configure server-side environment variables for local development login. Their values will not be shown in the browser."
            )
          : localized(
              "Supabase URL और anonymous key कॉन्फ़िगर होने के बाद वास्तविक प्रशासन लॉगिन उपलब्ध होगा।",
              "Real admin login will be available after Supabase URL and anonymous key are configured."
            )}
      </p>
      <div className="mt-5 rounded-lg border border-maroon-700/10 bg-cream-50 p-4 text-left">
        <p className="text-sm font-semibold text-brown-800">
          {localized("आवश्यक environment variables", "Required environment variables")}
        </p>
        {variables.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-7 text-maroon-900">
            {variables.map((variable) => (
              <li key={variable}>
                <code>{variable}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-7 text-maroon-900">
            {localized(
              "स्थानीय setup guide में दिए गए server-side variables कॉन्फ़िगर करें।",
              "Configure the server-side variables listed in the local setup guide."
            )}
          </p>
        )}
      </div>
      <div className="mt-5">
        <OutlineButton to={routePaths.home}>{localized("होम पेज पर वापस जाएं", "Back to home page")}</OutlineButton>
      </div>
    </section>
  );
}
