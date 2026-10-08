import { CustomerShell } from "@/components/nav/CustomerShell";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <CustomerShell>{children}</CustomerShell>;
}
