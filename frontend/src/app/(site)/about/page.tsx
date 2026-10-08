import { ArrowRight, Gem, NotebookPen, Scissors, ShieldCheck, Truck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { PhotoBanner } from "@/components/nav/PageBanner";
import { ButtonLink, LeafOrnament, Photo } from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";

const a = strings.aboutPage;
export const metadata: Metadata = { title: a.title };

const HIGHLIGHT_ICONS = [Gem, UsersRound, ShieldCheck, Truck];
const VALUES = [
  { icon: Scissors, image: media.careTailors, href: routes.services },
  { icon: NotebookPen, image: media.careTracking, href: routes.track },
  { icon: Truck, image: media.careDelivery, href: routes.howItWorks },
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden">
      <PhotoBanner title={a.title} lead={a.tagline} image={media.aboutBanner} photoClassName="bottom-0 w-[62%]" />

      <LeafOrnament className="absolute top-[30rem] -left-6 hidden w-24 opacity-50 lg:block" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-9 md:px-8 md:py-12">
        {/* Mission: photo collage + copy */}
        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <Reveal className="grid grid-cols-[1.45fr_1fr] gap-3">
            <Photo image={media.aboutFabric} className="min-h-96 rounded-card shadow-card" sizes="(min-width: 1024px) 26vw, 55vw" unoptimized />
            <div className="grid grid-rows-[1.25fr_0.8fr_1fr] gap-3">
              <Photo image={media.aboutThreads} className="rounded-card shadow-card" sizes="(min-width: 1024px) 18vw, 40vw" unoptimized />
              <Photo image={media.aboutEmbroidery} className="rounded-card shadow-card" sizes="(min-width: 1024px) 18vw, 40vw" unoptimized />
              <div className="relative flex flex-col justify-end overflow-hidden rounded-card border border-border bg-blush-wash p-4 shadow-card">
                <LeafOrnament className="absolute -top-2 -right-3 w-16 opacity-70" />
                <p className="text-3xl font-medium text-accent">{a.badgeValue}</p>
                <p className="text-sm text-text">{a.badgeLabel}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} className="flex flex-col gap-3">
            <p className="eyebrow">{a.missionTitle}</p>
            <h2 className="text-2xl md:text-[2rem] md:leading-tight">{a.tagline}</h2>
            <p className="text-sm leading-relaxed text-text">{a.lead}</p>
            <p className="text-sm leading-relaxed text-text">{a.mission}</p>
            <ul className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {a.highlights.map((label, i) => {
                const Icon = HIGHLIGHT_ICONS[i];
                return (
                  <li key={label} className="flex items-center gap-2.5">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Icon size={18} strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="text-xs leading-tight text-text">{label}</span>
                  </li>
                );
              })}
            </ul>
            <ButtonLink href={routes.book} size="lg" className="mt-4 self-start" rightIcon={<ArrowRight size={16} aria-hidden />}>
              {strings.home.bookNow}
            </ButtonLink>
          </Reveal>
        </section>

        {/* Values */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-10">
            <div>
              <p className="eyebrow">{a.valuesEyebrow}</p>
              <h2 className="mt-1 text-2xl md:text-[2rem]">{a.valuesTitle}</h2>
            </div>
            <p className="max-w-md text-sm text-muted">{a.valuesLead}</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {a.values.map((v, i) => {
              const { icon: Icon, image, href } = VALUES[i];
              return (
                <Reveal as="li" key={v.title} delay={i * 120}>
                  <Link
                    href={href}
                    className="group grid h-full grid-cols-[7.5rem_1fr] gap-4 rounded-card border border-border bg-surface p-2.5 shadow-card transition-[border-color,box-shadow] duration-300 ease-out-soft hover:border-border-strong hover:shadow-lift focus-ring"
                  >
                    <Photo image={image} className="min-h-32 rounded-control" sizes="8rem" zoomOnHover unoptimized />
                    <div className="flex flex-col gap-1.5 py-1.5 pr-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                          <Icon size={16} strokeWidth={1.6} aria-hidden />
                        </span>
                        <h3 className="text-base">{v.title}</h3>
                      </div>
                      <p className="text-xs leading-relaxed text-muted">{v.body}</p>
                      <span
                        aria-hidden
                        className="mt-auto inline-flex size-7 items-center justify-center self-end rounded-full bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent"
                      >
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
