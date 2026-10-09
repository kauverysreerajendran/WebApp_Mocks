import { ArrowRight, Clock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_LINKS } from "@/config/catalog";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { ButtonLink } from "../ui/Button";
import { Logo } from "./Logo";

const linkCls =
  "group inline-flex items-center gap-2 rounded-control text-sm text-muted transition-colors hover:text-accent focus-ring";

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={linkCls}>
      <span aria-hidden className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-3" />
      {children}
    </Link>
  );
}

const headingCls = "mb-1 text-sm font-semibold text-primary";

export function SiteFooter() {
  const n = strings.nav.customer;
  const c = strings.contactPage;
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      {/* CTA strip */}
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
        <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-blush-wash p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="max-w-xl">
            <h2 className="text-lg">{strings.footer.ctaTitle}</h2>
            <p className="mt-0.5 text-sm text-muted">{strings.footer.ctaBody}</p>
          </div>
          <ButtonLink href={routes.book} rightIcon={<ArrowRight size={16} aria-hidden />}>
            {strings.nav.bookNow}
          </ButtonLink>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted">{strings.footer.about}</p>
        </div>
        <nav aria-label={strings.footer.company} className="flex flex-col gap-2">
          <h2 className={headingCls}>{strings.footer.company}</h2>
          <FooterLink href={routes.services}>{n.services}</FooterLink>
          <FooterLink href={routes.howItWorks}>{n.howItWorks}</FooterLink>
          <FooterLink href={routes.about}>{n.about}</FooterLink>
          <FooterLink href={routes.contact}>{n.contact}</FooterLink>
        </nav>
        <nav aria-label={strings.footer.services} className="flex flex-col gap-2">
          <h2 className={headingCls}>{strings.footer.services}</h2>
          {CATEGORY_LINKS.map((cat) => (
            <FooterLink key={cat.slug} href={routes.bookService(cat.slug)}>
              {cat.label}
            </FooterLink>
          ))}
        </nav>
        <div className="flex flex-col gap-2">
          <h2 className={headingCls}>{strings.footer.reachUs}</h2>
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={linkCls}>
            <Phone size={14} aria-hidden className="text-accent" /> {c.phone}
          </a>
          <a href={`mailto:${c.email}`} className={linkCls}>
            <Mail size={14} aria-hidden className="text-accent" /> {c.email}
          </a>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Clock size={14} aria-hidden className="text-accent" /> {c.hours}
          </p>
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            <FooterLink href={routes.tailor.register}>{strings.footer.joinAsTailor}</FooterLink>
            <FooterLink href={routes.admin.login}>{strings.footer.adminLogin}</FooterLink>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted md:px-8">{strings.footer.rights(2026)}</p>
      </div>
    </footer>
  );
}
