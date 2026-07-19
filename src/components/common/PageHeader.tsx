import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  align = "left",
  className
}: PageHeaderProps) {
  const isCentered = align === "center";

  return (
    <header
      className={cn(
        "flex flex-col gap-5",
        isCentered && "mx-auto max-w-4xl items-center text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold text-communityGreen-700">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold leading-tight text-maroon-900 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-base leading-8 text-brown-700 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex w-full flex-col gap-3 sm:w-auto sm:flex-row",
            isCentered && "justify-center"
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
