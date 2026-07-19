import { paymentStatusConfig, registrationStatusConfig } from "../../config/statuses.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { cn } from "../../lib/cn";
import type { PaymentStatus, RegistrationStatus } from "../../types/status";

type StatusBadgeProps =
  | {
      type: "registration";
      status: RegistrationStatus;
      className?: string;
    }
  | {
      type: "payment";
      status: PaymentStatus;
      className?: string;
    };

export function StatusBadge(props: StatusBadgeProps) {
  const { language } = useLanguage();
  const config =
    props.type === "registration"
      ? registrationStatusConfig[props.status]
      : paymentStatusConfig[props.status];

  return (
    <span
      className={cn(
        "inline-flex min-h-8 max-w-full items-center rounded-full border px-3 py-1 text-left text-sm font-semibold leading-6 whitespace-normal",
        config.className,
        props.className
      )}
    >
      {language === "en" ? config.labelEn : config.label}
    </span>
  );
}
