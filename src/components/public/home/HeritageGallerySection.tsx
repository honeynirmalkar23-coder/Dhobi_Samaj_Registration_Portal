import { useState } from "react";
import { Info } from "lucide-react";
import { communityImages } from "../../../config/images.config";
import { useLanguage } from "../../../features/language/LanguageContext";
import { ImageLightbox } from "./ImageLightbox";
import type { LightboxImage } from "./ImageLightbox";

const galleryImageAssets = [
  {
    src: communityImages.heritagePhotoOne,
    width: 736,
    height: 736
  },
  {
    src: communityImages.heritageGroup,
    width: 256,
    height: 389
  },
  {
    src: communityImages.heritagePhotoTwo,
    width: 736,
    height: 506
  }
] as const;

export function HeritageGallerySection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { copy } = useLanguage();
  const galleryImages: Array<LightboxImage & { width: number; height: number }> =
    copy.home.gallery.images.map((image, index) => ({
      ...image,
      height: galleryImageAssets[index]?.height ?? galleryImageAssets[0].height,
      src: galleryImageAssets[index]?.src ?? galleryImageAssets[0].src,
      width: galleryImageAssets[index]?.width ?? galleryImageAssets[0].width
    }));

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <section className="bg-cream-50 py-12 sm:py-14">
      <div className="page-shell">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-maroon-900 sm:text-3xl">
            {copy.home.gallery.title}
          </h2>
          <p className="mt-3 text-base leading-8 text-brown-700">
            {copy.home.gallery.description}
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {galleryImages.map((image, index) => (
            <article
              className="overflow-hidden rounded-lg border border-maroon-700/10 bg-white shadow-subtle"
              key={image.src}
            >
              <button
                aria-label={`${image.caption} ${copy.common.viewLargeImage}`}
                className="focus-ring block w-full bg-cream-100"
                onClick={() => openLightbox(index)}
                type="button"
              >
                <img
                  alt={image.alt}
                  className="aspect-[4/3] w-full object-cover"
                  decoding="async"
                  height={image.height}
                  loading="lazy"
                  src={image.src}
                  width={image.width}
                />
              </button>
              <div className="p-4">
                <p className="text-sm font-semibold leading-7 text-brown-800">
                  {image.caption}
                </p>
                {image.description ? (
                  <p className="mt-2 line-clamp-4 text-sm leading-7 text-brown-700">
                    {image.description}
                  </p>
                ) : null}
                {image.source ? (
                  <p className="mt-2 text-xs font-semibold text-brown-700">
                    {image.source}
                  </p>
                ) : null}
                <button
                  className="focus-ring mt-3 min-h-11 rounded-md border border-maroon-700/20 px-4 py-2 text-sm font-semibold text-maroon-800 transition-colors hover:bg-maroon-50"
                  onClick={() => openLightbox(index)}
                  type="button"
                >
                  {copy.common.viewLargeImage}
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-7 grid gap-3 rounded-lg border border-saffron-500/30 bg-saffron-50 p-4 text-sm leading-7 text-brown-800 sm:grid-cols-[auto_minmax(0,1fr)]">
          <Info aria-hidden="true" className="mt-1 h-5 w-5 text-saffron-600" />
          <div className="space-y-2">
            {copy.home.gallery.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>
      </div>
      <ImageLightbox
        activeIndex={activeIndex}
        images={galleryImages}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onIndexChange={setActiveIndex}
        title={copy.home.gallery.lightboxTitle}
      />
    </section>
  );
}
