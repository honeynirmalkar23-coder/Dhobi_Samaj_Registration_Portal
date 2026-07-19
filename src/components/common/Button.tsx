import type { MouseEvent, MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

export type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  to?: string;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  "aria-controls"?: string;
  "aria-expanded"?: boolean;
  "aria-label"?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-maroon-700 bg-maroon-700 text-white shadow-subtle hover:bg-maroon-800 active:bg-maroon-900",
  secondary:
    "border border-saffron-500 bg-saffron-500 text-brown-900 shadow-subtle hover:bg-saffron-600 active:bg-saffron-600",
  outline:
    "border border-maroon-700/30 bg-white text-maroon-800 hover:border-maroon-700 hover:bg-maroon-50 active:bg-maroon-100",
  danger:
    "border border-red-700 bg-red-700 text-white shadow-subtle hover:bg-red-800 active:bg-red-900"
};

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-center text-sm font-semibold transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-60 sm:text-base";

export function Button(props: ButtonProps) {
  const {
    "aria-controls": ariaControls,
    "aria-expanded": ariaExpanded,
    "aria-label": ariaLabel,
    children,
    className,
    disabled = false,
    id,
    name,
    onClick,
    to,
    type = "button",
    variant = "primary"
  } = props;
  const classes = cn(baseClasses, variantClasses[variant], className);

  if (to) {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
      }
    };

    return (
      <Link
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        className={cn(classes, disabled && "pointer-events-none opacity-60")}
        onClick={handleClick}
        tabIndex={disabled ? -1 : undefined}
        to={to}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={classes}
      disabled={disabled}
      id={id}
      name={name}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

type VariantlessButtonProps = Omit<ButtonProps, "variant">;

export function PrimaryButton(props: VariantlessButtonProps) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: VariantlessButtonProps) {
  return <Button {...props} variant="secondary" />;
}

export function OutlineButton(props: VariantlessButtonProps) {
  return <Button {...props} variant="outline" />;
}

export function DangerButton(props: VariantlessButtonProps) {
  return <Button {...props} variant="danger" />;
}
