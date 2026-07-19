import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "../../lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-maroon-700/20 bg-cream-50 px-4 py-10 text-center",
        className
      )}
    >
      <Icon aria-hidden="true" className="h-10 w-10 text-communityGreen-700" />
      <h2 className="mt-4 text-xl font-bold text-maroon-900">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-7 text-brown-700">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
