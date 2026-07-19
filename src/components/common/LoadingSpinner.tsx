import { LoaderCircle } from "lucide-react";
import { useLanguage } from "../../features/language/LanguageContext";
import { cn } from "../../lib/cn";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label, className }: LoadingSpinnerProps) {
  const { localized } = useLanguage();

  return (
    <div className={cn("inline-flex items-center gap-3 text-brown-700", className)}>
      <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-maroon-700" />
      <span>{label ?? localized("लोड हो रहा है", "Loading")}</span>
    </div>
  );
}
