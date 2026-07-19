import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

type RegistrationSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function RegistrationSection({
  title,
  description,
  children,
  className
}: RegistrationSectionProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6",
        className
      )}
    >
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">{title}</h2>
        <p className="text-sm leading-7 text-brown-700">{description}</p>
      </div>
      {children}
    </section>
  );
}
