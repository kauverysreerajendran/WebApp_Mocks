import { Scissors, Shirt } from "lucide-react";
import { cn } from "@/lib/cn";

type Ratio = "square" | "portrait" | "landscape";

const ratios: Record<Ratio, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
};

interface GarmentImageProps {
  /** Real image URL when available; falls back to a styled placeholder. */
  src?: string;
  alt: string;
  ratio?: Ratio;
  variant?: "garment" | "tool";
  className?: string;
}

/**
 * Fixed-aspect image slot. Until real photography is supplied it renders a
 * fabric-textured placeholder so layouts never shift when images arrive.
 */
export function GarmentImage({ src, alt, ratio = "portrait", variant = "garment", className }: GarmentImageProps) {
  const Icon = variant === "tool" ? Scissors : Shirt;
  return (
    <div className={cn("relative w-full overflow-hidden bg-surface-muted", ratios[ratio], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- mock assets, no remote loader configured
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-accent-soft)_0_10px,var(--color-background)_10px_20px)]"
        >
          <Icon aria-hidden strokeWidth={1.25} className="size-1/4 text-border-strong" />
        </div>
      )}
    </div>
  );
}
