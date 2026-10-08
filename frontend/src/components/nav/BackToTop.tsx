"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={strings.nav.backToTop}
      onClick={() => window.scrollTo({ top: 0 })}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed right-4 bottom-4 z-30 inline-flex size-10 items-center justify-center rounded-full bg-accent text-on-accent shadow-lift transition-[background-color,opacity] duration-300 ease-out-soft hover:bg-accent-hover focus-ring",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ArrowUp size={16} aria-hidden />
    </button>
  );
}
