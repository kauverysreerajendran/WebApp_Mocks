import type { Metadata } from "next";
import { strings } from "@/i18n";

export const metadata: Metadata = {
  title: { default: strings.tailor.entryTitle, template: `%s · ${strings.brand.tailorPortal}` },
};

export default function TailorLayout({ children }: LayoutProps<"/tailor">) {
  return <div className="flex min-h-dvh flex-1 flex-col bg-background">{children}</div>;
}
