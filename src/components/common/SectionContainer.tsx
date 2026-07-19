import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type SectionContainerProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  as?: "section" | "div";
  variant?: "plain" | "card" | "muted";
  className?: string;
};

const variantClasses = {
  plain: "",
  card: "rounded-lg border border-maroon-700/10 bg-white p-5 shadow-soft sm:p-6",
  muted:
    "rounded-lg border border-saffron-500/20 bg-cream-50 p-5 shadow-subtle sm:p-6"
} as const;

export function SectionContainer({
  children,
  title,
  description,
  as: Component = "section",
  variant = "plain",
  className
}: SectionContainerProps) {
  return (
    <Component className={cn("min-w-0", variantClasses[variant], className)}>
      {title || description ? (
        <div className="mb-5 space-y-2">
          {title ? (
            <h2 className="text-xl font-bold text-maroon-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-7 text-brown-700">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </Component>
  );
}
