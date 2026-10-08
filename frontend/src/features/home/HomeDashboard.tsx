"use client";

import {
  ArrowRight,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  MapPin,
  PackageSearch,
  Ruler,
  ShieldCheck,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ButtonLink, Card, ListSkeleton, Photo, SectionHeading } from "@/components/ui";
import { CATEGORY_LINKS } from "@/config/catalog";
import { fallbackMedia, media, serviceTileMedia } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { customerApi } from "@/lib/api/endpoints";
import { useSession } from "@/lib/auth/session";
import { useApi } from "@/lib/hooks/useApi";
import { isActiveOrder } from "@/lib/status";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { QuickBookButton } from "@/features/booking/QuickBook";
import { ExploreServicesButton } from "./ExploreServices";
import { HeroScene } from "./HeroScene";
import { HowItWorksSteps } from "./HowItWorks";
import { PopularServices } from "./PopularServices";

const sh = strings.shell;
const h = strings.home;

const QUICK = [
  { href: routes.book, icon: CirclePlus, ...sh.quick.book },
  { href: routes.track, icon: PackageSearch, ...sh.quick.track },
  { href: routes.account, icon: ClipboardList, ...sh.quick.orders },
  { href: routes.services, icon: Ruler, ...sh.quick.services },
];

const PERK_ICONS: LucideIcon[] = [Truck, UserRound, ShieldCheck, MapPin];

/** Mock hero: big serif title with a rose second line, photo bleeding off the right, perks along the bottom. */
function Hero() {
  const session = useSession("customer");
  return (
    <section className="relative overflow-hidden bg-blush-wash">
      <div className="absolute inset-y-0 right-0 hidden w-[64%] [mask-image:linear-gradient(to_right,transparent,black_28%)] md:block">
        <HeroScene image={media.hero} />
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col px-4 md:px-8">
        <div className="flex max-w-xl flex-col gap-4 pt-6 pb-6 md:pt-11 md:pb-8">
          {session && <p className="eyebrow">{sh.greeting(session.user.name ?? "")}</p>}
          <h1 className="max-w-sm text-[2.25rem] leading-[1.05] font-medium tracking-[-0.02em] md:text-[3.25rem]">
            {sh.heroTitle}
            <br />
            <span className="text-accent">{sh.heroTitleAccent}</span>
          </h1>
          <p className="text-base leading-snug text-text">
            {sh.heroLead}
            <br />
            {sh.heroLead2}
          </p>
          {/* Phones: the studio photo sits inline as a compact card (desktop shows it bleeding off the right). */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card shadow-card md:hidden">
            <HeroScene image={media.hero} />
          </div>
          <div className="flex flex-wrap gap-3 pt-1 md:gap-4 md:pt-2">
            <QuickBookButton className="min-w-40">{sh.heroBook}</QuickBookButton>
            <ExploreServicesButton className="min-w-40">{sh.heroExplore}</ExploreServicesButton>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 pb-6 md:flex md:gap-10">
          {sh.perks.map((p, i) => {
            const Icon = PERK_ICONS[i];
            return (
              <li key={p.title} className="flex items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface/80 text-highlight shadow-card">
                  <Icon size={16} strokeWidth={1.5} aria-hidden />
                </span>
                <span className="text-xs leading-tight text-text">
                  {p.title}
                  <br />
                  {p.body}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const TILES = [
  ...CATEGORY_LINKS.map((c) => ({ key: c.slug, label: c.label, href: routes.bookService(c.slug), image: serviceTileMedia[c.slug] ?? fallbackMedia })),
  { key: "custom", label: sh.customDesign, href: routes.book, image: serviceTileMedia.custom },
];

/** "Our Services" strip of compact photo tiles with serif labels and a round chevron. */
function CategoryTiles() {
  return (
    <section aria-labelledby="home-categories" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 id="home-categories" className="text-xl">
          {sh.categoriesTitle}
        </h2>
        <Link href={routes.services} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-ring">
          {sh.viewAllServices}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map((t) => (
          <li key={t.key}>
            <Link
              href={t.href}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-lift focus-ring"
            >
              <Photo image={t.image} aspect="aspect-[4/3]" zoomOnHover unoptimized sizes="(min-width: 1024px) 16vw, 45vw" />
              <span className="flex flex-1 items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-sm leading-tight text-primary">{t.label}</span>
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
                  <ChevronRight size={14} aria-hidden />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Compact quick-action tiles: icon, title and a line of help text. */
function QuickActions() {
  return (
    <section aria-labelledby="quick-actions" className="flex flex-col gap-4">
      <SectionHeading id="quick-actions" eyebrow={sh.quickTitle} title={sh.quickHeading} />
      <ul className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map(({ href, icon: Icon, title, body }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-lift focus-ring"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
                <Icon size={18} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-primary">{title}</span>
                <span className="truncate text-xs text-muted">{body}</span>
              </span>
              <ChevronRight size={16} aria-hidden className="ml-auto shrink-0 text-muted transition-colors group-hover:text-accent" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Signed-in customers see live progress for each open order right on the home screen. */
function ActiveOrders() {
  const { data, status } = useApi("my-orders", customerApi.orders);
  const active = data?.filter((o) => isActiveOrder(o.status)) ?? [];
  return (
    <section aria-labelledby="home-active" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <h2 id="home-active" className="text-xl">
          {sh.activeTitle}
        </h2>
        <Link href={routes.account} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-ring">
          {sh.seeAll}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      {status === "loading" ? (
        <ListSkeleton rows={2} />
      ) : active.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {active.slice(0, 4).map((o) => (
            <li key={o.id}>
              <Link href={routes.accountOrder(o.id)} className="block h-full rounded-card focus-ring">
                <Card interactive className="flex h-full flex-col gap-3">
                  <p className="truncate text-sm font-medium text-text">
                    <span className="text-primary">{strings.common.orderNo(o.id)}</span> · {o.serviceName} · {o.packageName}
                  </p>
                  <OrderProgress status={o.status} compact />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted">{sh.activeEmpty}</p>
          <ButtonLink href={routes.book} size="sm">
            {sh.bookTailor}
          </ButtonLink>
        </Card>
      )}
    </section>
  );
}

export function HomeDashboard() {
  const session = useSession("customer");
  return (
    <>
      <Hero />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:px-8 md:py-10">
        <section aria-labelledby="home-services" className="flex flex-col gap-4">
          <SectionHeading id="home-services" eyebrow={h.servicesEyebrow} title={sh.servicesTitle} lead={h.popularLead} />
          <PopularServices />
        </section>
        <CategoryTiles />
        {session && <ActiveOrders />}
        <QuickActions />
        <section aria-labelledby="home-steps" className="flex flex-col gap-6">
          <SectionHeading id="home-steps" eyebrow={h.processEyebrow} title={sh.stepsTitle} />
          <HowItWorksSteps tone="light" />
        </section>
      </div>
    </>
  );
}
