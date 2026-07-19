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

export function HomePage() {
  const { copy } = useLanguage();

  usePageMetadata({
    title: copy.home.metadataTitle,
    description: copy.home.metadataDescription,
    ogImage: imagePaths.logoPlaceholder
  });

  return (
    <>
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
