import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../../../features/language/LanguageContext";
import { cn } from "../../../lib/cn";

export type LightboxImage = {
  src: string;
  alt: string;
  caption?: string;
  description?: string;
  source?: string;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  activeIndex: number;
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function ImageLightbox({
  images,
  activeIndex,
  isOpen,
  title,
  onClose,
  onIndexChange
}: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const { copy } = useLanguage();
  const image = images[activeIndex];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < images.length - 1;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        onIndexChange(activeIndex - 1);
        return;
      }

      if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        onIndexChange(activeIndex + 1);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, hasNext, hasPrevious, isOpen, onClose, onIndexChange]);

  if (!isOpen || !image) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brown-900/80 px-3 py-4 sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="image-lightbox-title"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-cream-50/20 bg-cream-50 shadow-soft"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-4 border-b border-maroon-700/10 px-4 py-3">
          <h2 className="text-base font-bold text-maroon-900" id="image-lightbox-title">
            {title}
          </h2>
          <button
            aria-label={copy.common.closeLargeImage}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md text-brown-700 transition-colors hover:bg-cream-200"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
          <div className="relative flex min-h-0 items-center justify-center bg-brown-900 p-3 sm:p-5">
            <button
              aria-label={copy.common.previousImage}
              className={cn(
                "focus-ring absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream-50/20 bg-cream-50/95 text-maroon-800 shadow-subtle transition-colors hover:bg-white",
                !hasPrevious && "cursor-not-allowed opacity-45"
              )}
              disabled={!hasPrevious}
              onClick={() => onIndexChange(activeIndex - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-6 w-6" />
            </button>
            <img
              alt={image.alt}
              className="max-h-[70vh] w-full object-contain"
              decoding="async"
              src={image.src}
            />
            <button
              aria-label={copy.common.nextImage}
              className={cn(
                "focus-ring absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream-50/20 bg-cream-50/95 text-maroon-800 shadow-subtle transition-colors hover:bg-white",
                !hasNext && "cursor-not-allowed opacity-45"
              )}
              disabled={!hasNext}
              onClick={() => onIndexChange(activeIndex + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          {image.caption || image.description || image.source ? (
            <div className="border-t border-maroon-700/10 px-4 py-3 text-sm leading-7 text-brown-700">
              {image.caption ? (
                <p className="font-semibold text-maroon-900">{image.caption}</p>
              ) : null}
              {image.description ? (
                <p className="mt-2">{image.description}</p>
              ) : null}
              {image.source ? (
                <p className="mt-2 text-xs font-semibold text-brown-700">{image.source}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
