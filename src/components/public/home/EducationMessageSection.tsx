import { useState } from "react";
import { communityImages } from "../../../config/images.config";
import { useLanguage } from "../../../features/language/LanguageContext";
import { ImageLightbox } from "./ImageLightbox";
import type { LightboxImage } from "./ImageLightbox";

const educationImageSources = [
  communityImages.educationQuoteOne,
  communityImages.educationQuoteTwo
] as const;

const imageDimensions = [
  { width: 480, height: 705 },
  { width: 735, height: 488 }
] as const;

export function EducationMessageSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { copy } = useLanguage();
  const educationImages: LightboxImage[] = copy.home.education.images.map((image, index) => ({
    ...image,
    src: educationImageSources[index] ?? educationImageSources[0]
  }));

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <section className="bg-cream-100 py-12 sm:py-14">
      <div className="page-shell">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-maroon-900 sm:text-3xl">
            {copy.home.education.title}
          </h2>
          <p className="mt-3 text-base leading-8 text-brown-700">
            {copy.home.education.description}
          </p>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {educationImages.map((image, index) => (
            <article
              className="rounded-lg border border-maroon-700/10 bg-white p-3 shadow-subtle"
              key={image.src}
            >
              <button
                aria-label={`${image.caption} ${copy.common.viewLargeImage}`}
                className="focus-ring block w-full rounded-md bg-cream-100 p-2"
                onClick={() => openLightbox(index)}
                type="button"
              >
                <img
                  alt={image.alt}
                  className="mx-auto max-h-[34rem] w-full object-contain"
                  decoding="async"
                  height={imageDimensions[index]?.height}
                  loading="lazy"
                  src={image.src}
                  width={imageDimensions[index]?.width}
                />
              </button>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-brown-800">{image.caption}</p>
                <button
                  className="focus-ring min-h-11 rounded-md border border-maroon-700/20 px-4 py-2 text-sm font-semibold text-maroon-800 transition-colors hover:bg-maroon-50"
                  onClick={() => openLightbox(index)}
                  type="button"
                >
                  {copy.common.viewLargeImage}
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-7 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 px-4 py-4 text-sm leading-7 text-communityGreen-700">
          {copy.home.education.note}
        </p>
      </div>
      <ImageLightbox
        activeIndex={activeIndex}
        images={educationImages}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onIndexChange={setActiveIndex}
        title={copy.home.education.lightboxTitle}
      />
    </section>
  );
}
