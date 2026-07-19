import { useEffect, useState } from "react";

export function useClipboard(resetMs = 1800) {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!hasCopied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setHasCopied(false), resetMs);

    return () => window.clearTimeout(timeoutId);
  }, [hasCopied, resetMs]);

  const copyText = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setHasCopied(true);
  };

  return {
    copyText,
    hasCopied
  };
}
