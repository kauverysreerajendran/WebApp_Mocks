import { Clock, Heart, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { PhotoBanner } from "@/components/nav/PageBanner";
import { LeafOrnament, Photo } from "@/components/ui";
import { media } from "@/config/media";
import { ContactForm } from "@/features/home/ContactForm";
import { strings } from "@/i18n";

const c = strings.contactPage;
export const metadata: Metadata = { title: c.title };

/** Line drawing of a sewing machine and spool, in the leaf ornament's rose-gold. */
function SewingSketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 96" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M8 88h112" />
      <path d="M16 88v-8h96v8" />
      <path d="M24 80V30c0-6 4-10 10-10h62c7 0 12 5 12 12v48" />
      <path d="M36 80V46c0-4 3-7 7-7h44c4 0 7 3 7 7v34" />
      <path d="M30 20v-6h8v6M88 20v-8M84 12h8" />
      <path d="M30 80v-8h6" />
      <circle cx="98" cy="40" r="5" />
      <circle cx="98" cy="40" r="1.5" />
      <path d="M44 28h36M44 32h20" opacity=".6" />
      <rect x="126" y="70" width="12" height="18" rx="2" />
      <path d="M124 70h16M124 88h16M128 75h8M128 79h8M128 83h8" opacity=".7" />
    </svg>
  );
}

export default function ContactPage() {
  const items = [
    { icon: Phone, label: c.phoneLabel, value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: c.emailLabel, value: c.email, href: `mailto:${c.email}` },
    { icon: Clock, label: c.hoursLabel, value: c.hours },
  ];
  return (
    <main>
      <PhotoBanner
        title={c.title}
        lead={c.bannerLead}
        image={media.contactBanner}
        photoClassName="bottom-0 w-[50%]"
        decoration={<LeafOrnament className="absolute top-6 left-[46%] hidden w-28 opacity-60 lg:block" />}
      />

      <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-[0.62fr_1.38fr] lg:gap-6">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="text-2xl md:text-[2rem]">{c.talkTitle}</h2>
          <p className="text-sm text-muted">{c.lead}</p>
          <ul className="mt-2 flex flex-col gap-3">
            {items.map(({ icon: Icon, label, value, href }, i) => (
              <Reveal as="li" key={label} delay={i * 100}>
                <div className="group flex items-center gap-3.5 rounded-card border border-border bg-surface p-3.5 shadow-card transition-[border-color,box-shadow] duration-300 ease-out-soft hover:border-border-strong hover:shadow-lift">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent">
                    <Icon size={17} strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-xs text-muted">{label}</span>
                    {href ? (
                      <a href={href} className="truncate rounded-control text-sm font-medium text-primary hover:text-accent focus-ring">
                        {value}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-primary">{value}</span>
                    )}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
          <div aria-hidden className="mt-3 hidden items-end gap-3 text-ornament lg:flex">
            <SewingSketch className="w-32 shrink-0" />
            <p className="flex items-center gap-2 pb-6 text-2xl leading-tight">
              {c.note}
              <Heart size={18} strokeWidth={1.4} />
            </p>
          </div>
        </div>

        <Reveal delay={120} className="grid gap-5 rounded-card border border-border bg-surface p-4 shadow-card md:grid-cols-[1.45fr_1fr] md:p-5">
          <ContactForm />
          <figure className="hidden flex-col overflow-hidden rounded-card border border-border bg-blush-wash md:flex">
            <Photo image={media.contactSide} className="min-h-60 flex-1" sizes="(min-width: 1024px) 22vw, 40vw" unoptimized />
            <figcaption className="relative flex items-center gap-3 px-4 py-4">
              <LeafOrnament className="w-9 shrink-0 opacity-80" />
              <span className="flex flex-col gap-2">
                <span className="text-sm leading-snug text-primary">{c.sideCaption}</span>
                <span aria-hidden className="h-px w-8 bg-accent" />
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </section>
    </main>
  );
}
