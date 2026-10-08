import { Plus } from "lucide-react";
import { strings } from "@/i18n";

/** Accessible accordion built on <details>, styled as compact rows. */
export function Faq() {
  return (
    <div className="flex flex-col gap-2">
      {strings.howPage.faqs.map((f, i) => (
        <details
          key={f.q}
          open={i === 0}
          className="group rounded-card border border-border bg-surface shadow-card transition-[border-color,box-shadow] open:border-border-strong"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 py-3 text-sm font-semibold text-primary focus-ring marker:hidden [&::-webkit-details-marker]:hidden">
            {f.q}
            <span
              aria-hidden
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-all duration-300 group-open:rotate-45 group-open:bg-accent group-open:text-on-accent"
            >
              <Plus size={14} />
            </span>
          </summary>
          <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
