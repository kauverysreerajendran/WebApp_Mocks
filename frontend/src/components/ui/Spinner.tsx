import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <LoaderCircle size={size} aria-hidden className={cn("animate-spin", className)} />;
}
