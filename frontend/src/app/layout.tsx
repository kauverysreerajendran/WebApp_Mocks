import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui";
import { appConfig } from "@/config/app";
import { strings } from "@/i18n";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${strings.brand.name} · ${strings.brand.tagline}`, template: `%s · ${strings.brand.name}` },
  description: strings.home.lead,
};

export const viewport: Viewport = {
  themeColor: "#93264b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={appConfig.locale} className={`${dmSans.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <noscript>
          <style>{`.reveal{opacity:1;transform:none}`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only z-50 rounded-control bg-surface px-4 py-2 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {strings.nav.skipToContent}
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
