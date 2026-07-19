import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useLanguage } from "../features/language/LanguageContext";
import { router } from "./router";

export function App() {
  const { localized } = useLanguage();

  return (
    <ErrorBoundary>
      <RouterProvider
        fallbackElement={
          <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
            <LoadingSpinner label={localized("पोर्टल लोड हो रहा है", "Portal is loading")} />
          </div>
        }
        router={router}
      />
    </ErrorBoundary>
  );
}
