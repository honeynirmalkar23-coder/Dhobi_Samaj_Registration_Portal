import { Languages } from "lucide-react";
import { useLanguage } from "../../features/language/LanguageContext";
import type { AppLanguage } from "../../features/language/language.copy";
import { cn } from "../../lib/cn";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { copy, language, setLanguage } = useLanguage();

  const options: Array<{ label: string; value: AppLanguage }> = [
    { label: copy.common.hindi, value: "hi" },
    { label: copy.common.english, value: "en" }
  ];

  return (
    <div
      aria-label={copy.common.languageToggleLabel}
      className={cn(
        "focus-within:ring-2 focus-within:ring-maroon-700/30 inline-flex items-center gap-1 rounded-md border border-maroon-700/20 bg-white p-1 text-sm font-bold text-brown-800 shadow-subtle",
        className
      )}
      role="group"
    >
      <Languages aria-hidden="true" className="ml-2 hidden h-4 w-4 text-maroon-700 sm:block" />
      {options.map((option) => (
        <button
          aria-pressed={language === option.value}
          className={cn(
            "focus-ring min-h-9 rounded px-3 py-1.5 transition-colors",
            language === option.value
              ? "bg-maroon-700 text-white"
              : "text-brown-800 hover:bg-cream-100 hover:text-maroon-900"
          )}
          key={option.value}
          onClick={() => setLanguage(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
