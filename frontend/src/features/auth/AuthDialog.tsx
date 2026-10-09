"use client";

import { useEffect, useId, type ReactNode } from "react";
import { useNativeDialog } from "@/components/ui";

/** Popup shell for the sign-in card: no chrome of its own, the card supplies the close button. */
export function AuthDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: (titleId: string) => ReactNode }) {
  const titleId = useId();
  const { ref, onBackdropClick } = useNativeDialog(open, onClose);

  // Start on the form's first field rather than the carousel arrow the browser would pick.
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("form input")?.focus();
  }, [open, ref]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-visible bg-transparent p-0 text-text backdrop:bg-overlay"
    >
      {open && children(titleId)}
    </dialog>
  );
}
