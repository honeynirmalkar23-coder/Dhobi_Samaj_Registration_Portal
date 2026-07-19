import { useRouteError } from "react-router-dom";
import { ErrorState } from "./ErrorState";
import { OutlineButton, PrimaryButton, SecondaryButton } from "./Button";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";

export function RouteErrorPage() {
  const { localized } = useLanguage();
  const error = useRouteError();
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const description =
    error instanceof Response
      ? localized("अनुरोधित पृष्ठ खोलने में समस्या आई।", "There was a problem opening the requested page.")
      : localized("इस पृष्ठ पर अस्थायी समस्या आई है।", "This page has encountered a temporary problem.");

  if (import.meta.env.DEV) {
    console.error("Unexpected route error", error);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-10">
      <ErrorState
        action={
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryButton onClick={() => window.location.reload()}>{localized("पृष्ठ फिर से खोलें", "Reopen the page")}</PrimaryButton>
            {isAdminRoute ? (
              <SecondaryButton to={routePaths.adminDashboard}>{localized("डैशबोर्ड पर जाएं", "Go to dashboard")}</SecondaryButton>
            ) : null}
            <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
          </div>
        }
        description={description}
        title={localized("पृष्ठ उपलब्ध नहीं है", "The page is not available")}
      />
    </main>
  );
}
