import { useLocation } from "react-router-dom";
import { CommunityInspirationSection } from "../../components/public/home/CommunityInspirationSection";
import { EducationMessageSection } from "../../components/public/home/EducationMessageSection";
import { HeritageGallerySection } from "../../components/public/home/HeritageGallerySection";
import { HomeCallToActionSection } from "../../components/public/home/HomeCallToActionSection";
import { HomeHeroSection } from "../../components/public/home/HomeHeroSection";
import { PortalAboutSection } from "../../components/public/home/PortalAboutSection";
import { PrivacyTransparencySection } from "../../components/public/home/PrivacyTransparencySection";
import { RegistrationProcessSection } from "../../components/public/home/RegistrationProcessSection";
import { RegistrationSearchSection } from "../../components/public/home/RegistrationSearchSection";
import { imagePaths } from "../../config/images.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { usePageMetadata } from "../../hooks/usePageMetadata";

type HomeLocationState = {
  paymentNotice?: {
    kind: "warning";
    message: string;
  };
};

export function HomePage() {
  const { copy } = useLanguage();
  const location = useLocation();
  const paymentNotice = (location.state as HomeLocationState | null)?.paymentNotice;

  usePageMetadata({
    title: copy.home.metadataTitle,
    description: copy.home.metadataDescription,
    ogImage: imagePaths.logoPlaceholder
  });

  return (
    <>
      {paymentNotice ? (
        <div className="page-shell pt-6">
          <div
            aria-live="polite"
            className="rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm font-semibold leading-7 text-brown-800"
            role="status"
          >
            {paymentNotice.message}
          </div>
        </div>
      ) : null}
      <HomeHeroSection />
      <RegistrationSearchSection />
      <RegistrationProcessSection />
      <PortalAboutSection />
      <CommunityInspirationSection />
      <EducationMessageSection />
      <HeritageGallerySection />
      <PrivacyTransparencySection />
      <HomeCallToActionSection />
    </>
  );
}
