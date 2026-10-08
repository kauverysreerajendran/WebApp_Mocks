import { MessageSquareText, UserRound } from "lucide-react";
import { ButtonLink, Photo } from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";

const b = strings.booking;

/** "Not sure what to choose?" promo strip shown under the booking flow. */
export function HelpBanner() {
  return (
    <section className="relative mt-10 overflow-hidden rounded-card border border-border bg-blush-wash">
      <div className="grid items-center gap-5 md:grid-cols-[13rem_1fr_auto] lg:grid-cols-[16rem_1fr_auto]">
        <div className="relative hidden h-full min-h-32 md:block">
          <Photo image={media.howFabric} className="absolute inset-0" sizes="256px" unoptimized />
          <span aria-hidden className="absolute inset-y-0 right-0 w-16 bg-linear-to-r from-transparent to-blush" />
        </div>
        <div className="flex flex-col gap-4 px-5 pt-5 md:flex-row md:items-center md:gap-8 md:p-0 md:py-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl">{b.helpTitle}</h2>
            <p className="text-sm text-muted">{b.helpBody}</p>
          </div>
          <ButtonLink
            href={routes.contact}
            variant="secondary"
            size="sm"
            className="self-start md:self-center"
            leftIcon={<MessageSquareText size={15} aria-hidden />}
          >
            {b.chatWithStylist}
          </ButtonLink>
        </div>
        <div className="flex items-center gap-3 px-5 pb-5 md:py-6 md:pr-8 md:pl-0">
          <span aria-hidden className="flex shrink-0 -space-x-3">
            {[0, 1].map((i) => (
              <span
                key={i}
                className="inline-flex size-11 items-center justify-center rounded-full border-2 border-surface bg-accent-soft text-accent shadow-card"
              >
                <UserRound size={18} strokeWidth={1.75} />
              </span>
            ))}
          </span>
          <p className="text-xs leading-snug text-text">
            {b.expertGuidance}
            <br />
            <span className="text-muted">{b.personalized}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
