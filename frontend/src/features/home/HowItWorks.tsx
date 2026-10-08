import { CalendarClock, ChevronRight, Palette, Shirt, Truck } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

const ICONS = [Shirt, Palette, CalendarClock, Truck];

/** The four booking steps from the client brief, numbered 01–04. */
export function HowItWorksSteps({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const dark = tone === "dark";
  return (
    <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <span
        aria-hidden
        className={cn("absolute top-6 right-[12%] left-[12%] hidden h-px border-t border-dashed lg:block", dark ? "border-white/20" : "border-border-strong")}
      />
      {strings.home.steps.map((step, i) => {
        const Icon = ICONS[i];
        return (
          <Reveal as="li" key={step.title} delay={i * 120} className="group relative flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "relative inline-flex size-12 items-center justify-center rounded-full border transition-colors duration-300",
                dark ? "border-white/20 bg-ink-soft text-on-ink group-hover:bg-accent" : "border-border bg-surface text-primary shadow-card group-hover:bg-accent group-hover:text-on-accent",
              )}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              <span className="absolute -top-1.5 -right-2 inline-flex size-5 items-center justify-center rounded-full bg-accent text-[0.625rem] font-semibold text-on-accent">
                {i + 1}
              </span>
            </span>
            <h3 className={cn("mt-1 text-sm", dark && "text-on-ink")}>{step.title}</h3>
            <p className={cn("max-w-56 text-xs", dark ? "text-on-ink-muted" : "text-muted")}>{step.body}</p>
          </Reveal>
        );
      })}
    </ol>
  );
}

/** Page-sized variant: large icon discs joined by dotted arrows (How It Works header). */
export function HowItWorksFlow({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {strings.home.steps.map((step, i) => {
        const Icon = ICONS[i];
        const last = i === strings.home.steps.length - 1;
        return (
          <Reveal as="li" key={step.title} delay={i * 120} className="group relative flex flex-col items-center gap-2 text-center">
            {!last && (
              <span
                aria-hidden
                className="absolute top-8 right-[calc(-50%+3.25rem)] left-[calc(50%+3.25rem)] hidden border-t-2 border-dotted border-accent/45 lg:block"
              >
                <ChevronRight size={14} strokeWidth={2} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+1px)] text-accent/70" />
              </span>
            )}
            <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-surface/90 text-primary shadow-card ring-1 ring-border transition-colors duration-300 group-hover:bg-accent group-hover:text-on-accent">
              <Icon size={26} strokeWidth={1.4} aria-hidden />
              <span className="absolute -top-1 -right-1.5 inline-flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-on-accent ring-2 ring-surface">
                {i + 1}
              </span>
            </span>
            <h3 className="mt-2 font-sans text-base font-semibold text-primary">{step.title}</h3>
            <p className="max-w-72 text-sm leading-relaxed text-muted">{step.body}</p>
          </Reveal>
        );
      })}
    </ol>
  );
}
