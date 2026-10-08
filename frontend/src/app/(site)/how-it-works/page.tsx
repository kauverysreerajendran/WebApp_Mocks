import { ArrowRight, CalendarClock } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { PhotoBanner } from "@/components/nav/PageBanner";
import { ButtonLink, Photo } from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { Faq } from "@/features/home/Faq";
import { HowItWorksFlow } from "@/features/home/HowItWorks";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.howPage.title };

export default function HowItWorksPage() {
  return (
    <main>
      <PhotoBanner
        title={strings.howPage.title}
        lead={strings.howPage.lead}
        image={media.howStudio}
        photoClassName="aspect-[1480/464] w-[56%]"
        fadeBottom
      >
        <HowItWorksFlow className="mt-10 md:mt-12" />
      </PhotoBanner>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-8 md:py-10 lg:grid-cols-[1fr_1fr_0.62fr] lg:items-stretch">
        <Reveal className="hidden lg:block">
          <Photo
            image={media.howFabric}
            className="h-full min-h-80 rounded-card shadow-card"
            sizes="(min-width: 1024px) 34vw, 100vw"
            unoptimized
          />
        </Reveal>
        <Reveal delay={100} className="flex flex-col gap-1">
          <p className="eyebrow">{strings.home.faqEyebrow}</p>
          <h2 className="text-2xl md:text-[1.75rem]">{strings.howPage.faqTitle}</h2>
          <p className="mb-3 text-sm text-muted">{strings.home.faqLead}</p>
          <Faq />
        </Reveal>
        <Reveal delay={200}>
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-card border border-border bg-blush-wash px-6 py-8 text-center shadow-card">
            <CalendarClock size={40} strokeWidth={1.25} className="text-accent" aria-hidden />
            <h2 className="mt-1 text-2xl">{strings.home.ctaTitle}</h2>
            <p className="max-w-60 text-sm text-muted">{strings.home.ctaBody}</p>
            <ButtonLink href={routes.book} size="lg" className="mt-3 w-full" rightIcon={<ArrowRight size={16} aria-hidden />}>
              {strings.home.bookNow}
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
