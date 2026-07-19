import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "../../features/language/LanguageContext";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useEscapeKey } from "../../hooks/useEscapeKey";

type MobileNavigationDrawerProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function MobileNavigationDrawer({
  isOpen,
  title,
  onClose,
  children
}: MobileNavigationDrawerProps) {
  const { localized } = useLanguage();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useClickOutside(drawerRef, onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-brown-900/50 lg:hidden">
      <div
        aria-labelledby="mobile-navigation-title"
        aria-modal="true"
        className="ml-auto flex h-full w-[min(22rem,88vw)] flex-col overflow-y-auto border-l border-maroon-700/15 bg-cream-50 shadow-soft"
        ref={drawerRef}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-maroon-700/10 px-4 py-4">
          <h2 className="text-base font-bold text-maroon-900" id="mobile-navigation-title">
            {title}
          </h2>
          <button
            aria-label={localized("मोबाइल मेनू बंद करें", "Close mobile menu")}
            className="focus-ring rounded-md p-2 text-brown-700 transition-colors hover:bg-cream-200"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 px-4 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
