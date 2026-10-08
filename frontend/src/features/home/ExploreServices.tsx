"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button, ListSkeleton, Modal, Photo, PriceTag } from "@/components/ui";
import { CATEGORY_LINKS } from "@/config/catalog";
import { fallbackMedia, serviceAltMedia } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { catalogApi } from "@/lib/api/endpoints";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";

const x = strings.exploreServices;

/** Compact list of every service in a popup: thumbnail, name, short description, starting price. */
function ExploreServicesDialog({ onClose }: { onClose: () => void }) {
  const { data, status } = useApi("services", catalogApi.services);
  // Fall back to the category list (no prices) if the catalogue API is unreachable.
  const rows =
    data?.map((s) => ({ slug: s.slug, name: s.name, description: s.description, price: s.startingPrice as number | null })) ??
    (status === "error" ? CATEGORY_LINKS.map((c) => ({ slug: c.slug, name: c.label, description: "", price: null })) : null);

  return (
    <Modal
      open
      onClose={onClose}
      title={x.title}
      size="lg"
      footer={
        <Link href={routes.services} onClick={onClose} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-ring">
          {x.viewAll}
          <ArrowRight size={14} aria-hidden />
        </Link>
      }
    >
      <p className="-mt-1 mb-3 text-sm text-muted">{x.lead}</p>
      {!rows ? (
        <ListSkeleton rows={5} />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map((s) => (
            <li key={s.slug}>
              <Link
                href={routes.bookService(s.slug)}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-card border border-border bg-surface p-2 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card focus-ring"
              >
                <Photo image={serviceAltMedia[s.slug] ?? fallbackMedia} className="size-16 shrink-0 rounded-control" sizes="64px" zoomOnHover unoptimized />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-primary group-hover:text-accent">{s.name}</span>
                  {s.description && <span className="truncate text-xs text-muted">{s.description}</span>}
                  {s.price !== null && (
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      {strings.common.startingFrom}
                      <PriceTag>{formatMoney(s.price)}</PriceTag>
                    </span>
                  )}
                </span>
                <ChevronRight size={16} aria-hidden className="shrink-0 text-muted group-hover:text-accent" />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={routes.book}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-card border border-dashed border-border-strong bg-blush-wash p-2 transition-colors hover:border-accent focus-ring"
            >
              <Photo image={serviceAltMedia.custom} className="size-16 shrink-0 rounded-control" sizes="64px" unoptimized />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-primary group-hover:text-accent">{strings.shell.customDesign}</span>
                <span className="truncate text-xs text-muted">{x.customBody}</span>
              </span>
              <ChevronRight size={16} aria-hidden className="shrink-0 text-muted group-hover:text-accent" />
            </Link>
          </li>
        </ul>
      )}
    </Modal>
  );
}

/** Secondary button that opens the services popup instead of navigating away. */
export function ExploreServicesButton({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open && <ExploreServicesDialog onClose={() => setOpen(false)} />}
    </>
  );
}
