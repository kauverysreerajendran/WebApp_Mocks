import Image from "next/image";
import type { MediaImage } from "@/config/media";
import { cn } from "@/lib/cn";

interface PhotoProps {
  image: MediaImage;
  /** Tailwind aspect class, e.g. "aspect-[4/5]". Omit when the parent sizes the photo. */
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  /** Editorial monochrome treatment that warms to colour on hover. */
  mono?: boolean;
  zoomOnHover?: boolean;
  /** Serve the source file as-is (no re-compression) — for hero art that must stay crisp. */
  unoptimized?: boolean;
  className?: string;
  imgClassName?: string;
}

/** Fixed-ratio, optimised photo. Fills its box so layouts never shift while loading. */
export function Photo({
  image,
  aspect,
  sizes = "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw",
  priority,
  mono,
  zoomOnHover,
  unoptimized,
  className,
  imgClassName,
}: PhotoProps) {
  return (
    // `fill` needs a positioned parent; keep a caller-supplied absolute/fixed position instead of forcing relative.
    <div className={cn(!/\b(absolute|fixed)\b/.test(className ?? "") && "relative", "overflow-hidden", !/\bbg-/.test(className ?? "") && "bg-surface-muted", aspect, className)}>
      <Image
        src={image.src.startsWith("http") ? `${image.src}?auto=format&fit=crop&w=1600&q=80` : image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className={cn(
          "object-cover transition-[transform,filter] duration-700 ease-out-soft",
          mono && "grayscale group-hover:grayscale-0",
          zoomOnHover && "group-hover:scale-105",
          imgClassName,
        )}
      />
    </div>
  );
}
