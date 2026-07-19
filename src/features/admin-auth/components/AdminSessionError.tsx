import { AlertTriangle } from "lucide-react";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../../components/common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useState } from "react";

export function AdminSessionError() {
  const { localized } = useLanguage();
  const { refreshSession, signOut } = useAdminAuth();
  const [isBusy, setIsBusy] = useState(false);

  const handleRetry = async () => {
    setIsBusy(true);
    await refreshSession();
    setIsBusy(false);
  };

  const handleLogout = async () => {
    setIsBusy(true);
    await signOut();
    setIsBusy(false);
  };

  return (
    <section
      aria-labelledby="admin-session-error-title"
      className="mx-auto max-w-2xl rounded-lg border border-maroon-700/20 bg-white p-6 text-center shadow-soft"
      role="alert"
    >
      <AlertTriangle aria-hidden="true" className="mx-auto h-10 w-10 text-maroon-700" />
      <h1 className="mt-4 text-2xl font-bold text-maroon-900" id="admin-session-error-title">
        {localized("प्रशासन सत्र प्राप्त नहीं हो सका", "Admin session could not be loaded")}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-brown-700">
        {localized(
          "अभी सुरक्षित प्रशासन सत्र जांचने में समस्या हुई। कृपया पुनः प्रयास करें या लॉगआउट करें।",
          "There was a problem checking the secure admin session. Please try again or log out."
        )}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <PrimaryButton disabled={isBusy} onClick={handleRetry}>{localized("पुनः प्रयास करें", "Try again")}</PrimaryButton>
        <SecondaryButton disabled={isBusy} onClick={handleLogout}>{localized("लॉगआउट", "Logout")}</SecondaryButton>
        <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
      </div>
    </section>
  );
}
