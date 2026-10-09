"use client";

import { Menu, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "../ui/Button";
import { CustomerAuthDialog, type CustomerAuthMode } from "@/features/auth/CustomerAuthDialog";
import { TailorAuthDialog } from "@/features/tailor/TailorAuthDialog";
import { LoginMenu, useLoginOptions } from "./LoginMenu";
import { Logo } from "./Logo";

const links = [
  { href: routes.home, label: strings.nav.customer.home },
  { href: routes.services, label: strings.nav.customer.services },
  { href: routes.howItWorks, label: strings.nav.customer.howItWorks },
  { href: routes.track, label: strings.nav.customer.track },
  { href: routes.about, label: strings.nav.customer.about },
  { href: routes.contact, label: strings.nav.customer.contact },
];

export function SiteHeader() {
  const pathname = usePathname();
  const session = useSession("customer");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const signedIn = Boolean(session);
  const accountLabel = signedIn ? strings.nav.customer.myOrders : strings.nav.customer.login;
  const accountHref = signedIn ? routes.account : routes.login;
  const initial = (session?.user.name ?? "").trim().charAt(0).toUpperCase();
  const loginOptions = useLoginOptions();
  const [authMode, setAuthMode] = useState<CustomerAuthMode | null>(null);
  const [tailorLogin, setTailorLogin] = useState(false);
  const router = useRouter();

  // `?login=customer|tailor` (redirects, sign-out, old links) opens the popup over this page.
  const params = useSearchParams();
  const loginParam = params.get("login");
  const [seenParam, setSeenParam] = useState<string | null>(null);
  if (loginParam !== seenParam) {
    setSeenParam(loginParam);
    if (loginParam === "customer") setAuthMode("login");
    if (loginParam === "tailor") setTailorLogin(true);
  }
  const clearParam = () => {
    if (loginParam) router.replace(pathname, { scroll: false });
  };
  const closeCustomer = () => {
    setAuthMode(null);
    clearParam();
  };
  const closeTailor = () => {
    setTailorLogin(false);
    clearParam();
  };
  /** After customer sign-in, continue to `?next=` (same-site paths only) or stay on this page. */
  const customerDone = () => {
    const next = params.get("next");
    setAuthMode(null);
    if (next?.startsWith("/") && !next.startsWith("//")) router.replace(next);
    else clearParam();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-surface/90 backdrop-blur transition-shadow duration-300",
        scrolled ? "border-transparent shadow-card" : "border-border",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Logo />

        <nav aria-label={strings.nav.primary} className="hidden lg:block">
          <ul className="flex items-center gap-3">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-14 items-center px-3 text-sm transition-colors focus-ring",
                      active ? "text-accent" : "text-primary hover:text-accent",
                    )}
                  >
                    {l.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3 bottom-3.5 h-0.5 rounded-full bg-accent transition-opacity duration-200",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={routes.track}
            aria-label={strings.common.search}
            title={strings.common.search}
            className="hidden size-9 items-center justify-center rounded-full text-primary transition-colors hover:text-accent focus-ring md:inline-flex"
          >
            <Search size={17} strokeWidth={1.75} aria-hidden />
          </Link>
          {signedIn ? (
            <Link
              href={accountHref}
              aria-label={accountLabel}
              title={accountLabel}
              className="hidden size-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent ring-2 ring-accent/20 transition-colors hover:bg-accent hover:text-on-accent focus-ring md:inline-flex"
            >
              {initial || <UserRound size={16} aria-hidden />}
            </Link>
          ) : (
            <>
              <LoginMenu className="hidden md:block" onCustomer={() => setAuthMode("login")} onTailor={() => setTailorLogin(true)} />
              <Button size="sm" className="hidden min-w-18 md:inline-flex" onClick={() => setAuthMode("signup")}>
                {strings.nav.customer.signUp}
              </Button>
            </>
          )}
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-control border border-border text-primary transition-colors hover:border-accent hover:text-accent focus-ring lg:hidden"
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? strings.nav.closeMenu : strings.nav.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="site-mobile-nav" aria-label={strings.nav.primary} className="border-t border-border bg-surface lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {[
              ...links,
              ...(signedIn
                ? [{ href: accountHref, label: accountLabel }]
                : loginOptions.map((o) => ({ href: o.href, label: `${strings.nav.customer.login} · ${o.label}` }))),
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={(e) => {
                    setOpen(false);
                    if (!signedIn && l.href === routes.login) {
                      e.preventDefault();
                      setAuthMode("login");
                    } else if (!signedIn && l.href === routes.tailor.login) {
                      e.preventDefault();
                      setTailorLogin(true);
                    }
                  }}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center border-b border-border text-sm font-medium focus-ring",
                    isActive(l.href) ? "text-accent" : "text-primary",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <ButtonLink href={routes.book} fullWidth onClick={() => setOpen(false)}>
                {strings.nav.bookNow}
              </ButtonLink>
            </li>
          </ul>
        </nav>
      )}
      <CustomerAuthDialog mode={authMode} onModeChange={setAuthMode} onClose={closeCustomer} onDone={customerDone} />
      <TailorAuthDialog open={tailorLogin} onClose={closeTailor} onRegister={() => router.push(routes.tailor.register)} />
    </header>
  );
}
