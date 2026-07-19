import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorState } from "./ErrorState";
import { OutlineButton, PrimaryButton, SecondaryButton } from "./Button";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

function ErrorBoundaryFallback({ onReset }: { onReset: () => void }) {
  const { localized } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-10">
      <ErrorState
        action={
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <PrimaryButton onClick={onReset}>{localized("पृष्ठ फिर से खोलें", "Reopen the page")}</PrimaryButton>
            {window.location.pathname.startsWith("/admin") ? (
              <SecondaryButton to={routePaths.adminDashboard}>{localized("डैशबोर्ड पर जाएं", "Go to dashboard")}</SecondaryButton>
            ) : null}
            <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
          </div>
        }
        description={localized(
          "पृष्ठ दिखाने में समस्या आई। कृपया फिर से प्रयास करें।",
          "There was a problem displaying the page. Please try again."
        )}
        title={localized("पृष्ठ लोड नहीं हो सका", "The page could not load")}
      />
    </main>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Unexpected application error", {
        componentStack: errorInfo.componentStack,
        error
      });
    }
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback onReset={this.reset} />;
    }

    return this.props.children;
  }
}
