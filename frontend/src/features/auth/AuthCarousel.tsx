"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Photo } from "@/components/ui";
import { authSlides } from "@/config/media";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

const a = strings.authCard;
const AUTOPLAY_MS = 5000;
const SWIPE_PX = 40;

/** Each change uses the next transition in turn: slide → crossfade → zoom. */
const EFFECTS = ["slide", "fade", "zoom"] as const;

interface View {
  active: number;
  prev: number;
  dir: 1 | -1;
  step: number;
}

/** Auto-playing photo carousel for the sign-in card: arrows, dots and swipe. */
export function AuthCarousel({ className }: { className?: string }) {
  const count = authSlides.length;
  const [view, setView] = useState<View>({ active: 0, prev: -1, dir: 1, step: 0 });
  const swipeX = useRef<number | null>(null);

  const go = useCallback(
    (to: number, dir: 1 | -1) => {
      const next = ((to % count) + count) % count;
      setView((v) => (next === v.active ? v : { active: next, prev: v.active, dir, step: v.step + 1 }));
    },
    [count],
  );

  // Advances on its own; a manual move restarts the timer.
  useEffect(() => {
    const t = window.setTimeout(() => go(view.active + 1, 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [view.active, go]);

  const fx = EFFECTS[Math.max(view.step - 1, 0) % EFFECTS.length];
  const caption = a.slides[view.active];

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-blush select-none", className)}
      onPointerDown={(e) => (swipeX.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeX.current === null) return;
        const dx = e.clientX - swipeX.current;
        swipeX.current = null;
        if (Math.abs(dx) > SWIPE_PX) go(view.active + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }}
    >
      {authSlides.map((image, i) => (
        <div
          key={image.src}
          aria-hidden={i !== view.active}
          data-state={i === view.active ? "in" : i === view.prev ? "out" : "idle"}
          data-fx={view.step === 0 ? "none" : fx}
          style={{ "--dir": view.dir } as CSSProperties}
          className="auth-slide absolute inset-0"
        >
          <Photo image={image} className="absolute inset-0" sizes="(min-width: 768px) 480px, 100vw" priority={i === 0} />
        </div>
      ))}

      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-ink/75 via-ink/15 to-transparent" />

      <button
        type="button"
        aria-label={a.prev}
        onClick={() => go(view.active - 1, -1)}
        className="absolute top-1/2 left-4 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-ink/25 text-white backdrop-blur-sm hover:bg-ink/45 focus-ring md:inline-flex"
      >
        <ChevronLeft size={18} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={a.next}
        onClick={() => go(view.active + 1, 1)}
        className="absolute top-1/2 right-4 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-ink/25 text-white backdrop-blur-sm hover:bg-ink/45 focus-ring md:inline-flex"
      >
        <ChevronRight size={18} aria-hidden />
      </button>

      <div key={view.active} aria-live="polite" className="auth-caption absolute inset-x-0 bottom-0 z-20 px-5 pb-9 md:px-7 md:pb-12">
        <p className="text-xl leading-tight font-medium text-white md:text-[1.75rem]">
          {caption.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p className="mt-1.5 text-xs text-white/90 md:text-sm">{caption.body}</p>
        <span aria-hidden className="mt-4 hidden h-px w-10 bg-white/80 md:block" />
      </div>

      <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 md:bottom-4">
        {authSlides.map((image, i) => (
          <button
            key={image.src}
            type="button"
            aria-label={a.goTo(i + 1)}
            aria-current={i === view.active || undefined}
            onClick={() => go(i, i > view.active ? 1 : -1)}
            className={cn(
              "size-2 rounded-full transition-colors duration-300 focus-ring",
              i === view.active ? "bg-white" : "bg-white/50 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </div>
  );
}
