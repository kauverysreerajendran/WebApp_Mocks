import type { Metadata } from "next";
import { strings } from "@/i18n";

export const metadata: Metadata = {
  title: { default: strings.brand.adminConsole, template: `%s · ${strings.brand.adminConsole}` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <>{children}</>;
}
