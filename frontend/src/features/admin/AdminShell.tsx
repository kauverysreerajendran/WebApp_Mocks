"use client";

import {
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/nav/Logo";
import type { NavItem } from "@/components/nav/BottomNav";
import { Sidebar } from "@/components/nav/Sidebar";
import { Drawer } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { sessions, type Session } from "@/lib/auth/session";
import { RequireSession } from "@/features/auth/RequireSession";

const n = strings.nav.admin;

export const ADMIN_NAV: NavItem[] = [
  { href: routes.admin.root, label: n.overview, icon: LayoutDashboard, exact: true },
  { href: routes.admin.orders, label: n.orders, icon: ClipboardList },
  { href: routes.admin.assignVendor, label: n.assignVendor, icon: UserCog },
  { href: routes.admin.assignExecutive, label: n.assignExecutive, icon: Truck },
  { href: routes.admin.updateStatus, label: n.updateStatus, icon: RefreshCw },
  { href: routes.admin.payments, label: n.payments, icon: CreditCard },
  { href: routes.admin.verification, label: n.verification, icon: ShieldCheck },
  { href: routes.admin.executives, label: n.executives, icon: Users },
];

function SidebarFooter({ session }: { session: Session }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between gap-2 px-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{session.user.name}</p>
        <p className="truncate text-xs text-muted">{session.user.email}</p>
      </div>
      <button
        type="button"
        aria-label={strings.common.logout}
        onClick={() => {
          sessions.admin.set(null);
          router.replace(routes.admin.login);
        }}
        className="inline-flex size-8 items-center justify-center rounded-control text-muted hover:bg-accent-soft hover:text-accent focus-ring"
      >
        <LogOut size={16} aria-hidden />
      </button>
    </div>
  );
}

function Shell({ session, children }: { session: Session; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = ADMIN_NAV;

  return (
    <div className="flex min-h-dvh bg-background">
      <div className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar
          items={items}
          label={strings.nav.primary}
          header={<Logo href={routes.admin.root} />}
          footer={<SidebarFooter session={session} />}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
          <button
            type="button"
            aria-label={strings.nav.openMenu}
            onClick={() => setMenuOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-control border border-border text-text hover:bg-surface-muted focus-ring"
          >
            <Menu size={18} aria-hidden />
          </button>
          <Logo href={routes.admin.root} />
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-6 md:py-6">
          {children}
        </main>
      </div>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={strings.brand.adminConsole} side="left">
        <Sidebar
          items={items}
          label={strings.nav.primary}
          className="-mx-6 -my-5 w-auto border-0"
          footer={<SidebarFooter session={session} />}
          onNavigate={() => setMenuOpen(false)}
        />
      </Drawer>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireSession role="admin" loginHref={(next) => `${routes.admin.login}?next=${encodeURIComponent(next)}`}>
      {(session) => <Shell session={session}>{children}</Shell>}
    </RequireSession>
  );
}
