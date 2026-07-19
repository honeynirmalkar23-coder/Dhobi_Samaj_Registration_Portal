import { cn } from "../../lib/cn";

type LoadingSkeletonProps = {
  lines?: number;
  className?: string;
};

export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div
      aria-label="सामग्री लोड हो रही है"
      className={cn("space-y-3", className)}
      role="status"
    >
      {Array.from({ length: lines }).map((_, index) => (
        <div
          className={cn(
            "h-4 animate-pulse rounded-md bg-maroon-700/10",
            index === lines - 1 && "w-2/3"
          )}
          key={index}
        />
      ))}
    </div>
  );
}
