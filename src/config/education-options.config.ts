export const educationLevelOptions = [
  { value: "no_formal_education", label: "कोई औपचारिक शिक्षा नहीं", labelEn: "No formal education" },
  { value: "primary", label: "प्राथमिक", labelEn: "Primary" },
  { value: "middle", label: "माध्यमिक", labelEn: "Middle school" },
  { value: "higher_secondary", label: "उच्च माध्यमिक", labelEn: "Higher secondary" },
  { value: "iti", label: "आईटीआई", labelEn: "ITI" },
  { value: "diploma", label: "डिप्लोमा", labelEn: "Diploma" },
  { value: "graduate", label: "स्नातक", labelEn: "Graduate" },
  { value: "post_graduate", label: "स्नातकोत्तर", labelEn: "Post graduate" },
  { value: "phd", label: "पीएचडी", labelEn: "PhD" },
  { value: "other", label: "अन्य", labelEn: "Other" }
] as const;

export type EducationLevelValue = (typeof educationLevelOptions)[number]["value"];
