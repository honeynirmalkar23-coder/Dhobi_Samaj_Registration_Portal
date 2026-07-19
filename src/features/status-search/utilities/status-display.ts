import type { RegistrationStatus } from "../../../types/status";

export type TimelineStepState = "completed" | "active" | "pending" | "rejected" | "archived";

export type TimelineStep = {
  id: string;
  label: string;
  state: TimelineStepState;
};

const baseTimelineSteps = [
  {
    id: "created",
    labelEn: "Registration created",
    label: "पंजीकरण बनाया गया"
  },
  {
    id: "payment",
    labelEn: "Payment proof submitted",
    label: "भुगतान प्रमाण जमा किया गया"
  },
  {
    id: "review",
    labelEn: "Administrative review",
    label: "प्रशासनिक समीक्षा"
  },
  {
    id: "approved",
    labelEn: "Registration approved",
    label: "पंजीकरण स्वीकृत"
  }
] as const;

function getStepLabel(index: number, language: "hi" | "en"): string {
  const step = baseTimelineSteps[index] ?? baseTimelineSteps[0];

  return language === "en" ? step.labelEn : step.label;
}

export function getRegistrationTimelineSteps(
  status: RegistrationStatus,
  language: "hi" | "en" = "hi"
): TimelineStep[] {
  if (status === "rejected") {
    return [
      { id: "created", label: getStepLabel(0, language), state: "completed" },
      { id: "payment", label: getStepLabel(1, language), state: "completed" },
      { id: "review", label: language === "en" ? "Correction or rejection" : "सुधार या अस्वीकृति", state: "rejected" },
      { id: "approved", label: getStepLabel(3, language), state: "pending" }
    ];
  }

  if (status === "archived") {
    return [
      { id: "created", label: getStepLabel(0, language), state: "completed" },
      { id: "payment", label: getStepLabel(1, language), state: "completed" },
      { id: "review", label: getStepLabel(2, language), state: "completed" },
      { id: "archived", label: language === "en" ? "Record archived" : "रिकॉर्ड संग्रहित", state: "archived" }
    ];
  }

  const completedStepCount: Record<Exclude<RegistrationStatus, "rejected" | "archived">, number> = {
    awaiting_payment: 1,
    submitted: 2,
    under_review: 2,
    approved: 4
  };

  return baseTimelineSteps.map((step, index) => {
    if (status === "under_review" && step.id === "review") {
      return {
        id: step.id,
        label: language === "en" ? step.labelEn : step.label,
        state: "active"
      };
    }

    return {
      id: step.id,
      label: language === "en" ? step.labelEn : step.label,
      state: index < completedStepCount[status] ? "completed" : "pending"
    };
  });
}
