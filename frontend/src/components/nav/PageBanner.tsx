import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { MediaImage } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { Photo } from "../ui/Photo";

/** Rounded frame for a single picture — sits beside page titles. */
export function PictureFrame({ image, caption, className }: { image: MediaImage; caption?: string; className?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-card bg-surface shadow-card ring-4 ring-white/70", className)}>
      <Photo image={image} aspect="aspect-[4/3]" sizes="(min-width: 1024px) 20rem, 16rem" priority />
      {caption && <figcaption className="px-3 py-2 text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** Home › Current trail shown above page titles. */
export function Breadcrumb({ current, className }: { current: ReactNode; className?: string }) {
  return (
    <nav aria-label={strings.nav.breadcrumb} className={className}>
      <ol className="flex items-center gap-1.5 text-xs text-muted">
        <li>
          <Link href={routes.home} className="rounded-control hover:text-accent focus-ring">
            {strings.nav.customer.home}
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight size={12} />
        </li>
        <li aria-current="page" className="font-medium text-accent">
          {current}
        </li>
      </ol>
    </nav>
  );
}

interface PhotoBannerProps {
  title: ReactNode;
  lead?: ReactNode;
  image: MediaImage;
  /** Sizing of the photo panel; it always fades into the wash on its left edge. */
  photoClassName?: string;
  /** Also fade the photo out towards the bottom (for banners with content below the title). */
  fadeBottom?: boolean;
  /** Decorations layered over the wash (e.g. a leaf ornament). */
  decoration?: ReactNode;
  children?: ReactNode;
}

/** Editorial page header: breadcrumb, large serif title and lead on a blush wash, with a photo bleeding off the right. */
export function PhotoBanner({ title, lead, image, photoClassName, fadeBottom, decoration, children }: PhotoBannerProps) {
  return (
    <section className="relative overflow-hidden bg-blush-wash">
      <div
        className={cn(
          "absolute top-0 right-0 hidden [mask-image:linear-gradient(to_right,transparent,black_38%)] md:block",
          photoClassName ?? "bottom-0 w-[60%]",
        )}
      >
        <div className={cn("absolute inset-0", fadeBottom && "[mask-image:linear-gradient(to_bottom,black_60%,transparent)]")}>
          <Photo image={image} className="absolute inset-0 bg-transparent" sizes="60vw" priority unoptimized />
        </div>
      </div>
      {decoration}
      <div className="relative mx-auto flex max-w-7xl flex-col px-4 pt-6 pb-9 md:px-8 md:pt-9 md:pb-11">
        <Breadcrumb current={title} />
        <h1 className="mt-4 text-4xl leading-[1.05] font-medium tracking-[-0.02em] md:text-[3.25rem]">{title}</h1>
        {lead && <p className="mt-3 max-w-xl text-base text-text md:text-lg">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

interface PageBannerProps {
  title: ReactNode;
  image: MediaImage;
  lead?: ReactNode;
  actions?: ReactNode;
  /** Shorter header with a smaller frame (booking flow). */
  compact?: boolean;
  /** Hide the Home › Title trail (the home page itself). */
  breadcrumb?: boolean;
  /** Small accent label above the title. */
  eyebrow?: string;
  /** Larger title and a full-height photo panel for the home screen. */
  hero?: boolean;
}

/** App page header on a blush wash: breadcrumb, title and lead on the left, a picture on the right. */
export function PageBanner({ title, image, lead, actions, eyebrow, hero = false, compact = false, breadcrumb = true }: PageBannerProps) {
  if (hero) {
    return (
      <section className="bg-blush-wash border-b border-border">
        <div className="mx-auto grid max-w-7xl items-stretch md:grid-cols-[1.05fr_1fr]">
          <div className="flex min-w-0 flex-col justify-center gap-3 px-4 pt-10 pb-20 md:px-8 md:pt-14 md:pb-24">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="max-w-xl text-3xl md:text-4xl">{title}</h1>
            {lead && <p className="max-w-md text-muted">{lead}</p>}
            {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
          </div>
          <div className="relative hidden min-h-96 md:block">
            <Photo image={image} className="absolute inset-0" sizes="(min-width: 768px) 50vw, 100vw" priority />
            <span aria-hidden className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-blush to-transparent" />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="bg-blush-wash border-b border-border">
      <div
        className={cn(
          "mx-auto grid max-w-7xl items-center gap-6 px-4 md:grid-cols-[1fr_auto] md:px-8",
          compact ? "py-5" : "py-7 md:py-8",
        )}
      >
        <div className="flex min-w-0 flex-col gap-2">
          {breadcrumb && <Breadcrumb current={title} />}
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className={cn(compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl")}>{title}</h1>
          {lead && <p className="max-w-2xl text-sm text-muted">{lead}</p>}
          {actions && <div className="flex flex-wrap gap-3 pt-1">{actions}</div>}
        </div>
        <PictureFrame image={image} className={cn("hidden md:block", compact ? "w-40" : "w-56 lg:w-64")} />
      </div>
    </section>
  );
}
