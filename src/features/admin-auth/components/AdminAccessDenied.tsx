import { ShieldAlert } from "lucide-react";
import { OutlineButton, PrimaryButton } from "../../../components/common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useState } from "react";

export function AdminAccessDenied() {
  const { localized } = useLanguage();
  const { signOut } = useAdminAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <section
      aria-labelledby="admin-access-denied-title"
      className="mx-auto max-w-2xl rounded-lg border border-maroon-700/20 bg-white p-6 text-center shadow-soft"
      role="alert"
    >
      <ShieldAlert aria-hidden="true" className="mx-auto h-10 w-10 text-maroon-700" />
      <h1 className="mt-4 text-2xl font-bold text-maroon-900" id="admin-access-denied-title">
        {localized("प्रशासनिक पहुंच उपलब्ध नहीं है", "Administrative access is unavailable")}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-brown-700">
        {localized(
          "आपका लॉगिन सफल हो सकता है, लेकिन इस खाते को trusted administrator भूमिका प्राप्त नहीं है।",
          "Your login may be valid, but this account does not have the trusted administrator role."
        )}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <PrimaryButton disabled={isSigningOut} onClick={handleLogout}>
          {isSigningOut ? localized("लॉगआउट किया जा रहा है…", "Logging out…") : localized("लॉगआउट", "Logout")}
        </PrimaryButton>
        <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
      </div>
    </section>
  );
}
