import { Archive, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { RegistrationStatus } from "../../../types/status";
import { getRegistrationTimelineSteps } from "../utilities/status-display";
import type { TimelineStepState } from "../utilities/status-display";

type RegistrationStatusTimelineProps = {
  registrationStatus: RegistrationStatus;
};

const stateLabels: Record<TimelineStepState, string> = {
  completed: "पूर्ण",
  active: "सक्रिय",
  pending: "लंबित",
  rejected: "अस्वीकृत",
  archived: "संग्रहित"
};

const stateLabelsEn: Record<TimelineStepState, string> = {
  completed: "Completed",
  active: "Active",
  pending: "Pending",
  rejected: "Rejected",
  archived: "Archived"
};

const stateClasses: Record<TimelineStepState, string> = {
  completed: "border-communityGreen-600/25 bg-communityGreen-50 text-communityGreen-700",
  active: "border-saffron-500/35 bg-saffron-50 text-brown-800",
  pending: "border-brown-700/15 bg-white text-brown-700",
  rejected: "border-maroon-700/25 bg-maroon-50 text-maroon-800",
  archived: "border-brown-700/15 bg-cream-100 text-brown-700"
};

function getStateIcon(state: TimelineStepState) {
  if (state === "completed") {
    return CheckCircle2;
  }

  if (state === "active") {
    return Clock;
  }

  if (state === "rejected") {
    return XCircle;
  }

  if (state === "archived") {
    return Archive;
  }

  return Circle;
}

export function RegistrationStatusTimeline({ registrationStatus }: RegistrationStatusTimelineProps) {
  const { language, localized } = useLanguage();
  const steps = getRegistrationTimelineSteps(registrationStatus, language);
  const labels = language === "en" ? stateLabelsEn : stateLabels;

  return (
    <section aria-labelledby="registration-timeline-title" className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
      <h3 className="text-lg font-bold text-maroon-900" id="registration-timeline-title">
        {localized("पंजीकरण प्रगति", "Registration progress")}
      </h3>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => {
          const Icon = getStateIcon(step.state);

          return (
            <li
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-sm leading-7",
                stateClasses[step.state]
              )}
              key={step.id}
            >
              <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{step.label}</p>
                <p>{labels[step.state]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
