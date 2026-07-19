import { Info } from "lucide-react";
import { cn } from "../../lib/cn";

type DevelopmentNoticeProps = {
  message?: string;
  className?: string;
};

export function DevelopmentNotice({
  message = "Phase 01 में केवल एप्लिकेशन आधार, रूटिंग, लेआउट और placeholder इंटरफ़ेस तैयार किया गया है।",
  className
}: DevelopmentNoticeProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm leading-7 text-brown-800",
        className
      )}
      role="status"
    >
      <Info aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-saffron-600" />
      <p>{message}</p>
    </div>
  );
}
