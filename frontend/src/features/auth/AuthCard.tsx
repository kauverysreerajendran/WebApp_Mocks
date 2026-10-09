"use client";

import { ArrowRight, ShieldCheck, X } from "lucide-react";
import type { ReactNode } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { AuthCarousel } from "./AuthCarousel";

const a = strings.authCard;

export interface AuthTab<K extends string> {
  key: K;
  label: string;
}

interface AuthCardProps<K extends string> {
  /** Two-part heading; the second word is set in the accent colour ("Welcome back"). */
  heading: [string, string];
  lead: string;
  tabs: AuthTab<K>[];
  active: K;
  onTab: (key: K) => void;
  children: ReactNode;
  titleId?: string;
  onClose?: () => void;
  className?: string;
}

/** Sign-in card shared by the customer popup and the tailor portal: photo carousel left, form right. */
export function AuthCard<K extends string>({ heading, lead, tabs, active, onTab, children, titleId, onClose, className }: AuthCardProps<K>) {
  return (
    <div className={cn("relative grid w-full grid-cols-1 overflow-hidden rounded-card bg-surface shadow-modal md:h-[34rem] md:grid-cols-[1.12fr_1fr]", className)}>
      <AuthCarousel className="h-44 md:h-full" />

      <div className="flex min-h-0 flex-col overflow-y-auto px-6 py-6 md:px-8 md:py-9">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.common.close}
            className="absolute top-3 right-3 z-30 inline-flex size-8 items-center justify-center rounded-control text-white transition-colors hover:bg-surface-muted hover:text-text focus-ring md:text-muted"
          >
            <X size={18} aria-hidden />
          </button>
        )}

        <h2 id={titleId} className="text-3xl font-semibold md:text-[2rem]">
          {heading[0]} <span className="text-accent">{heading[1]}</span>
        </h2>
        <p className="mt-1 text-sm text-muted md:text-base">{lead}</p>

        <div role="tablist" className="mt-6 mb-5 grid grid-cols-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active === t.key}
              onClick={() => onTab(t.key)}
              className={cn(
                "-mb-px border-b-2 pb-2.5 text-sm focus-ring",
                active === t.key ? "border-accent font-medium text-accent" : "border-transparent text-muted hover:text-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {children}

        <div className="mt-auto pt-6">
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            {a.or}
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck size={15} aria-hidden className="text-accent" />
            {a.secure}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Full-width submit label: text centred, arrow pinned to the right edge. */
export function AuthSendLabel({ label }: { label: ReactNode }) {
  return (
    <>
      <span aria-hidden className="w-4" />
      <span className="flex-1 text-center">{label}</span>
      <ArrowRight size={16} aria-hidden />
    </>
  );
}
