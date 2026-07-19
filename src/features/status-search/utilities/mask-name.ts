const emptyNameFallback = "नाम उपलब्ध नहीं";

function maskWord(word: string): string {
  const characters = Array.from(word);

  if (characters.length === 0) {
    return "";
  }

  if (characters.length === 1) {
    return "*";
  }

  if (characters.length === 2) {
    return `${characters[0]}*`;
  }

  const visiblePrefix = characters.slice(0, 2).join("");
  const maskLength = Math.max(2, characters.length - 2);

  return `${visiblePrefix}${"*".repeat(maskLength)}`;
}

export function maskApplicantName(value: string | null | undefined): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return emptyNameFallback;
  }

  return trimmedValue
    .split(/\s+/)
    .map((word) => maskWord(word))
    .filter(Boolean)
    .join(" ");
}
