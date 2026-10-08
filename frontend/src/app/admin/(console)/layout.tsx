import { AdminShell } from "@/features/admin/AdminShell";

// Session-gated client shell: content depends on the signed-in user, so navigations here may block.
export const instant = false;

export default function AdminConsoleLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
