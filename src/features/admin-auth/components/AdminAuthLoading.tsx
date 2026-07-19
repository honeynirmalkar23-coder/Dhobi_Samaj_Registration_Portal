import { Loader2 } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";

type AdminAuthLoadingProps = {
  message?: string;
};

export function AdminAuthLoading({ message }: AdminAuthLoadingProps) {
  const { localized } = useLanguage();

  return (
    <div
      aria-live="polite"
      className="mx-auto flex min-h-[16rem] max-w-xl flex-col items-center justify-center rounded-lg border border-maroon-700/10 bg-white p-6 text-center shadow-soft"
      role="status"
    >
      <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-maroon-700" />
      <h1 className="mt-4 text-2xl font-bold text-maroon-900">
        {message ?? localized("प्रशासन सत्र जांचा जा रहा है…", "Checking admin session…")}
      </h1>
    </div>
  );
}
