import Image from "next/image";
import { cn } from "@/lib/cn";

/** Hand-drawn rose-gold leaf sprig (transparent PNG). Purely decorative — size and place it with `className`. */
export function LeafOrnament({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <Image
      src="/media/leaf-line.png"
      alt=""
      aria-hidden
      width={273}
      height={334}
      className={cn("pointer-events-none h-auto select-none", flip && "-scale-x-100", className)}
    />
  );
}
