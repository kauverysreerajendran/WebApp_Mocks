"use client";

import { ChevronDown, ShieldCheck, Store, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { buttonClasses } from "../ui/Button";

const m = strings.nav.loginMenu;

/** Who is signing in. A tailor already signed in goes straight to their dashboard. */
export function useLoginOptions(): { href: string; label: string; body: string; icon: LucideIcon }[] {
  const tailor = useSession("tailor");
  return [
    { href: routes.login, label: m.customer, body: m.customerBody, icon: UserRound },
    { href: tailor ? routes.tailor.dashboard : routes.tailor.login, label: m.tailor, body: m.tailorBody, icon: Store },
    { href: routes.admin.login, label: m.admin, body: m.adminBody, icon: ShieldCheck },
  ];
}

/** Header "Login ▾" dropdown: Customer · Tailor · Admin. */
export function LoginMenu({ className, onCustomer, onTailor }: { className?: string; onCustomer?: () => void; onTailor?: () => void }) {
  const options = useLoginOptions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(buttonClasses({ variant: "secondary", size: "sm" }), "min-w-18 gap-1")}
      >
        {strings.nav.customer.login}
        <ChevronDown size={14} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" aria-label={m.title} className="absolute right-0 z-40 mt-2 w-64 rounded-card border border-border bg-surface p-1.5 shadow-modal">
          {options.map(({ href, label, body, icon: Icon }) => (
            <Link
              key={label}
              role="menuitem"
              href={href}
              onClick={(e) => {
                setOpen(false);
                // Customers and signed-out tailors log in in a popup on the current page.
                if (href === routes.login && onCustomer) {
                  e.preventDefault();
                  onCustomer();
                } else if (href === routes.tailor.login && onTailor) {
                  e.preventDefault();
                  onTailor();
                }
              }}
              className="flex items-center gap-3 rounded-control px-2.5 py-2 hover:bg-surface-muted focus-ring"
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon size={15} aria-hidden />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-primary">{label}</span>
                <span className="text-xs text-muted">{body}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
