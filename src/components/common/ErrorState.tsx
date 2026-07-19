import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "../../features/language/LanguageContext";
import { cn } from "../../lib/cn";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  description,
  action,
  className
}: ErrorStateProps) {
  const { localized } = useLanguage();

  return (
    <div
      className={cn(
        "rounded-lg border border-maroon-700/20 bg-white p-6 text-center shadow-soft",
        className
      )}
      role="alert"
    >
      <AlertTriangle aria-hidden="true" className="mx-auto h-10 w-10 text-maroon-700" />
      <h1 className="mt-4 text-2xl font-bold text-maroon-900">
        {title ?? localized("कुछ गलत हो गया", "Something went wrong")}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-brown-700">
        {description ?? localized("कृपया कुछ समय बाद पुनः प्रयास करें।", "Please try again after some time.")}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
