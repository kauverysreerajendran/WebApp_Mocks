import { Suspense, type ReactNode } from "react";
import { strings } from "@/i18n";
import { Logo } from "./Logo";
import { SiteHeader } from "./SiteHeader";

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:px-8">
        <Logo />
      </div>
    </header>
  );
}

/**
 * Customer app frame: header navigation only (no side menu), a warm cream canvas for page
 * content, and a one-line footer.
 */
export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background">
      {/* SiteHeader reads the pathname, which suspends on dynamic routes during prerender. */}
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <div id="main" className="flex flex-1 flex-col">
        {children}
      </div>
      <footer className="border-t border-border bg-surface">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted md:px-8">{strings.footer.rights(2026)}</p>
      </footer>
    </div>
  );
}
