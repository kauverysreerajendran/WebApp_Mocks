import { Check } from "lucide-react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";

interface StepperProps {
  steps: readonly string[];
  /** zero-based index of the active step */
  current: number;
  /** "horizontal" (default) = row of steps; "vertical" = numbered column with labels under each circle. */
  orientation?: "horizontal" | "vertical";
  className?: string;
  /** Makes steps clickable (horizontal only). `canSelect` limits which ones; default: all. */
  onSelect?: (index: number) => void;
  canSelect?: (index: number) => boolean;
}

function StepDot({ index, done, active }: { index: number; done: boolean; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-[background-color,border-color,box-shadow]",
        done && "border-accent bg-accent-soft text-accent",
        active && "border-accent bg-accent text-on-accent ring-4 ring-accent/15",
        !done && !active && "border-border-strong bg-surface text-muted",
      )}
    >
      {done ? <Check size={14} strokeWidth={3} aria-hidden /> : index + 1}
    </span>
  );
}

/** Progress indicator. Collapses to "Step x of y" + bar on small screens. */
export function Stepper({ steps, current, orientation = "horizontal", className, onSelect, canSelect }: StepperProps) {
  const pct = ((current + 1) / steps.length) * 100;
  const selectable = (i: number) => Boolean(onSelect) && i !== current && (canSelect?.(i) ?? true);

  if (orientation === "vertical") {
    return (
      <nav aria-label={strings.common.stepOf(current + 1, steps.length)} className={className}>
        <ol className="flex flex-col items-center">
          {steps.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={label} className="flex flex-col items-center">
                <span className="flex flex-col items-center gap-1.5" aria-current={active ? "step" : undefined}>
                  <StepDot index={i} done={done} active={active} />
                  <span
                    className={cn(
                      "max-w-28 text-center text-xs leading-tight",
                      active ? "font-medium text-accent" : done ? "text-text" : "text-muted",
                    )}
                  >
                    {label}
                  </span>
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden className={cn("my-2.5 h-8 w-px", done ? "bg-accent" : "bg-border-strong")} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label={strings.common.stepOf(current + 1, steps.length)} className={className}>
      {/* Compact (mobile) */}
      <div className="md:hidden">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-primary">{steps[current]}</span>
          <span className="text-xs text-muted">{strings.common.stepOf(current + 1, steps.length)}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-border" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        {onSelect && (
          <div className="mt-2 flex justify-between">
            {steps.map((label, i) => (
              <button
                key={label}
                type="button"
                disabled={!selectable(i)}
                onClick={() => onSelect(i)}
                aria-label={label}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-[0.6875rem] font-semibold focus-ring",
                  i === current ? "bg-accent text-on-accent" : i < current ? "bg-accent-soft text-accent" : "bg-surface-muted text-muted",
                  "disabled:cursor-default",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full (tablet+) */}
      <ol className="hidden items-center md:flex">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
              {selectable(i) ? (
                <button
                  type="button"
                  onClick={() => onSelect!(i)}
                  className="group flex items-center gap-2 rounded-control focus-ring"
                >
                  <StepDot index={i} done={done} active={active} />
                  <span className={cn("text-xs whitespace-nowrap group-hover:text-accent group-hover:underline", done ? "text-text" : "text-muted")}>
                    {label}
                  </span>
                </button>
              ) : (
                <span className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                  <StepDot index={i} done={done} active={active} />
                  <span
                    className={cn(
                      "text-xs whitespace-nowrap",
                      active ? "font-semibold text-accent" : done ? "text-text" : "text-muted",
                    )}
                  >
                    {label}
                  </span>
                </span>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden className={cn("mx-3 h-px flex-1", done ? "bg-accent" : "bg-border-strong")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
