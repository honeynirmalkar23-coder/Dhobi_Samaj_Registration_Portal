import { Image as ImageIcon } from "lucide-react";
import { cn } from "../../lib/cn";

type ResponsiveImageProps = {
  alt: string;
  src?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
  placeholderLabel?: string;
  className?: string;
};

const aspectClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[4/3]"
} as const;

export function ResponsiveImage({
  alt,
  src,
  aspect = "wide",
  placeholderLabel = "छवि placeholder",
  className
}: ResponsiveImageProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-lg border border-maroon-700/10 bg-cream-100",
        aspectClasses[aspect],
        className
      )}
    >
      {src ? (
        <img alt={alt} className="h-full w-full object-cover" loading="lazy" src={src} />
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 text-center text-brown-700">
          <ImageIcon aria-hidden="true" className="h-9 w-9 text-communityGreen-700" />
          <span className="text-sm font-semibold">{placeholderLabel}</span>
        </div>
      )}
    </div>
  );
}
