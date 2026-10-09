"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Native <dialog> gives us focus trapping, Escape-to-close, inert background
 * and top-layer stacking without a dependency.
 */
export function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  /** Close when the backdrop (the dialog element itself) is clicked. */
  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return { ref, onBackdropClick };
}

function DialogHeader({ titleId, title, onClose }: { titleId: string; title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3">
      <h2 id={titleId} className="text-lg">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label={strings.common.close}
        className="-mr-2 inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-muted hover:text-text focus-ring"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}

const backdrop = "backdrop:bg-overlay";

export function Modal({ open, onClose, title, children, footer, size = "md" }: BaseDialogProps & { size?: "sm" | "md" | "lg" }) {
  const titleId = useId();
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-card bg-surface p-0 text-text shadow-modal",
        widths[size],
        backdrop,
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <DialogHeader titleId={titleId} title={title} onClose={onClose} />
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
}: BaseDialogProps & { side?: "left" | "right" }) {
  const titleId = useId();
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className={cn(
        "m-0 h-dvh max-h-dvh w-full bg-surface p-0 text-text shadow-modal",
        side === "right" ? "ml-auto max-w-xl" : "mr-auto max-w-xs",
        backdrop,
      )}
    >
      {open && (
        <div className="flex h-full flex-col">
          <DialogHeader titleId={titleId} title={title} onClose={onClose} />
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
