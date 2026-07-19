import { useEffect } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { OutlineButton } from "../../components/common/Button";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionContainer } from "../../components/common/SectionContainer";
import { routePaths } from "../../config/routes.config";
import { AdminAccessDenied } from "../../features/admin-auth/components/AdminAccessDenied";
import { AdminAuthLoading } from "../../features/admin-auth/components/AdminAuthLoading";
import { AdminConfigurationRequired } from "../../features/admin-auth/components/AdminConfigurationRequired";
import { AdminLoginForm } from "../../features/admin-auth/components/AdminLoginForm";
import { AdminSessionError } from "../../features/admin-auth/components/AdminSessionError";
import { useAdminAuth } from "../../features/admin-auth/hooks/useAdminAuth";
import { useLanguage } from "../../features/language/LanguageContext";
import type { AdminLoginSubmitValues } from "../../features/admin-auth/schemas/admin-login.schema";
import { getSafeAdminRedirectPath } from "../../features/admin-auth/utilities/admin-redirect";
import { usePageMetadata } from "../../hooks/usePageMetadata";

type LoginLocationState = {
  from?: unknown;
};

export function AdminLoginPage() {
  const { localized } = useLanguage();
  const { authenticationMode, signIn, status } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = getSafeAdminRedirectPath((location.state as LoginLocationState | null)?.from);

  usePageMetadata({
    title: localized("प्रशासन लॉगिन", "Admin login"),
    description: localized("अधिकृत प्रशासकों के लिए सुरक्षित लॉगिन।", "Secure login for authorized administrators.")
  });

  useEffect(() => {
    if (status === "authenticated_admin") {
      navigate(routePaths.adminDashboard, {
        replace: true
      });
    }
  }, [navigate, status]);

  const handleLogin = async ({ email, password }: AdminLoginSubmitValues) => {
    const result = await signIn(email, password);

    if (!result.ok) {
      throw new Error("ADMIN_LOGIN_FAILED");
    }

    navigate(redirectPath, {
      replace: true
    });
  };

  if (status === "configuration_missing") {
    return <AdminConfigurationRequired />;
  }

  if (status === "loading") {
    return <AdminAuthLoading message={localized("प्रशासन लॉगिन स्थिति जांची जा रही है…", "Checking admin login status…")} />;
  }

  if (status === "authenticated_non_admin") {
    return <AdminAccessDenied />;
  }

  if (status === "error") {
    return <AdminSessionError />;
  }

  if (status === "authenticated_admin") {
    return <AdminAuthLoading message={localized("प्रशासन डैशबोर्ड खोला जा रहा है…", "Opening admin dashboard…")} />;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        align="center"
        description={localized("यह क्षेत्र केवल अधिकृत प्रशासकों के लिए है।", "This area is only for authorized administrators.")}
        title={localized("प्रशासन लॉगिन", "Admin login")}
      />

      <div className="mx-auto w-full max-w-md">
        <SectionContainer variant="card">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-maroon-700 text-white">
              <LockKeyhole aria-hidden="true" className="h-7 w-7" />
            </div>
          </div>
          {authenticationMode === "local-dev" ? (
            <div
              className="rounded-lg border border-saffron-500/25 bg-saffron-50 px-4 py-3 text-sm leading-7 text-brown-800"
              role="status"
            >
              <h2 className="font-bold text-maroon-900">
                {localized("स्थानीय विकास लॉगिन", "Local development login")}
              </h2>
              <p className="mt-1">
                {localized(
                  "यह लॉगिन केवल स्थानीय UI परीक्षण के लिए सक्रिय है। उत्पादन वातावरण में Supabase प्रशासन प्रमाणीकरण का उपयोग किया जाएगा।",
                  "This login is active only for local UI testing. Supabase admin authentication will be used in production."
                )}
              </p>
            </div>
          ) : null}
          <AdminLoginForm onSubmit={handleLogin} />
        </SectionContainer>

        <div className="mt-5 flex justify-center">
          <OutlineButton to={routePaths.home}>
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            {localized("होम पेज पर वापस जाएं", "Back to home page")}
          </OutlineButton>
        </div>
      </div>
    </div>
  );
}
