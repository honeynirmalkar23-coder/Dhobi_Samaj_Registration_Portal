import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { OutlineButton, PrimaryButton } from "./Button";
import { useLanguage } from "../../features/language/LanguageContext";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { cn } from "../../lib/cn";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  isOpen,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  showCancel = true,
  onConfirm,
  onCancel,
  className
}: ConfirmDialogProps) {
  const { localized } = useLanguage();
  const resolvedConfirmLabel = confirmLabel ?? localized("पुष्टि करें", "Confirm");
  const resolvedCancelLabel = cancelLabel ?? localized("रद्द करें", "Cancel");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useClickOutside(dialogRef, onCancel, isOpen);
  useEscapeKey(onCancel, isOpen);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-900/50 px-4 py-6">
      <div
        aria-describedby="confirm-dialog-description"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className={cn(
          "w-full max-w-md rounded-lg border border-maroon-700/15 bg-white p-5 shadow-soft",
          className
        )}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-dialog-title" className="text-xl font-bold text-maroon-900">
            {title}
          </h2>
          <button
            aria-label={localized("संवाद बंद करें", "Close dialog")}
            className="focus-ring rounded-md p-2 text-brown-700 transition-colors hover:bg-cream-100"
            onClick={onCancel}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <p id="confirm-dialog-description" className="mt-3 text-sm leading-7 text-brown-700">
          {description}
        </p>
        {children ? <div className="mt-4 text-sm leading-7 text-brown-700">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {showCancel ? <OutlineButton onClick={onCancel}>{resolvedCancelLabel}</OutlineButton> : null}
          <PrimaryButton onClick={onConfirm}>{resolvedConfirmLabel}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
