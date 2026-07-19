const unavailableDateLabel = "उपलब्ध नहीं";

type DateDisplayOptions = {
  includeTime?: boolean;
  timeZone?: string;
};

export function formatPublicDate(
  value: string | number | Date | null | undefined,
  options: DateDisplayOptions = {}
): string {
  if (value === null || value === undefined || value === "") {
    return unavailableDateLabel;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return unavailableDateLabel;
  }

  return new Intl.DateTimeFormat("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(options.includeTime
      ? {
          hour: "numeric",
          minute: "2-digit"
        }
      : {}),
    timeZone: options.timeZone ?? "Asia/Kolkata"
  }).format(date);
}
