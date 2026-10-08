"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Photo, PriceTag, Skeleton } from "@/components/ui";
import { POPULAR_FALLBACK } from "@/config/catalog";
import { fallbackMedia, serviceAltMedia, serviceMedia } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { catalogApi } from "@/lib/api/endpoints";
import type { ServiceSummary } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { Reveal } from "@/components/motion/Reveal";

/** Compact service row: small thumbnail, title, one-line description, starting price. */
export function ServiceCard({ service, index, title }: { service: ServiceSummary; index: number; title?: string }) {
  const name = title ?? service.name;
  return (
    <Link
      href={routes.bookService(service.slug)}
      className="group flex h-full items-center gap-3 rounded-card border border-border bg-surface p-2.5 shadow-card transition-[border-color,box-shadow] duration-300 ease-out-soft hover:border-border-strong hover:shadow-lift focus-ring"
    >
      <Photo
        image={serviceAltMedia[service.slug] ?? serviceMedia[service.slug] ?? fallbackMedia}
        className="size-20 shrink-0 rounded-control"
        sizes="80px"
        zoomOnHover
        unoptimized
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.6875rem] font-medium tracking-wide text-accent uppercase">{strings.home.serviceNo(index + 1)}</span>
        <h3 className="truncate text-sm transition-colors group-hover:text-accent">{name}</h3>
        <p className="truncate text-xs text-muted">{service.description}</p>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          {strings.common.startingFrom}
          <PriceTag>{formatMoney(service.startingPrice)}</PriceTag>
        </span>
      </div>
      <span
        aria-hidden
        className="inline-flex size-7 shrink-0 items-center justify-center self-center rounded-full border border-border text-muted transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent"
      >
        <ArrowUpRight size={14} />
      </span>
    </Link>
  );
}

export function ServiceGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-3" role="status" aria-label={strings.common.loading}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-card border border-border bg-surface p-2.5 shadow-card">
          <Skeleton className="size-20 shrink-0" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Home "Popular Services": the services flagged popular (Designer Blouse, Kurti Stitching, Alterations). */
export function PopularServices() {
  const { data, status } = useApi("services", catalogApi.services);
  if (status === "loading") return <ServiceGridSkeleton />;
  const popular = data?.filter((s) => s.isPopular) ?? [];
  // API down or nothing flagged → the brief's three services with their published starting prices.
  const items: { service: ServiceSummary; title: string }[] = popular.length
    ? popular.map((s) => ({ service: s, title: s.promoTitle ?? s.name }))
    : POPULAR_FALLBACK.map((p, i) => ({
        service: { id: -(i + 1), slug: p.slug, name: p.title, category: p.title, description: p.description, imageUrl: null, isPopular: true, promoTitle: p.title, startingPrice: p.startingPrice, packages: [] },
        title: p.title,
      }));
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(({ service, title }, i) => (
        <Reveal key={service.slug} delay={i * 120} className="h-full">
          <ServiceCard service={service} index={i} title={title} />
        </Reveal>
      ))}
    </div>
  );
}
