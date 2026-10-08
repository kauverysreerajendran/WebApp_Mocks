import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "dark" | "highlight" | "light" | "text" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out-soft focus-ring " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 select-none";

const lift = "shadow-card hover:shadow-lift disabled:hover:shadow-card";

const variants: Record<ButtonVariant, string> = {
  primary: `bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent ${lift}`,
  secondary: "border border-accent bg-surface text-accent hover:bg-accent-soft disabled:hover:bg-surface",
  dark: `bg-primary text-on-primary hover:bg-primary-hover ${lift}`,
  highlight: `bg-highlight text-on-highlight hover:bg-highlight-hover ${lift}`,
  light: "border border-white/40 bg-transparent text-on-ink hover:border-white hover:bg-white hover:text-primary",
  text: "text-accent underline-offset-4 hover:underline disabled:hover:no-underline",
  danger: "bg-error text-on-primary hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-base",
};

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function buttonClasses({ variant = "primary", size = "md", fullWidth }: StyleProps = {}) {
  return cn(base, variants[variant], variant === "text" ? "h-auto px-1" : sizes[size], fullWidth && "w-full");
}

interface ButtonProps extends ComponentProps<"button">, StyleProps {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link>, StyleProps {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
