import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../components/common/Button";
import { PageHeader } from "../components/common/PageHeader";
import { SectionContainer } from "../components/common/SectionContainer";
import { routePaths } from "../config/routes.config";
import { useLanguage } from "../features/language/LanguageContext";
import { usePageMetadata } from "../hooks/usePageMetadata";

export function NotFoundPage() {
  const { localized } = useLanguage();
  const navigate = useNavigate();

  usePageMetadata({
    title: localized("पृष्ठ नहीं मिला", "Page not found"),
    description: localized(
      "आप जिस पृष्ठ की तलाश कर रहे हैं, वह उपलब्ध नहीं है।",
      "The page you are looking for is not available."
    )
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionContainer variant="card">
        <PageHeader
          actions={
            <>
              <PrimaryButton to={routePaths.home}>
                <Home aria-hidden="true" className="h-5 w-5" />
                {localized("होम पेज पर जाएं", "Go to home page")}
              </PrimaryButton>
              <SecondaryButton onClick={() => navigate(-1)}>
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                {localized("पिछला पृष्ठ", "Previous page")}
              </SecondaryButton>
            </>
          }
          align="center"
          description={localized(
            "आप जिस पृष्ठ की तलाश कर रहे हैं, वह उपलब्ध नहीं है।",
            "The page you are looking for is not available."
          )}
          title={localized("पृष्ठ नहीं मिला", "Page not found")}
        />
      </SectionContainer>
    </div>
  );
}
