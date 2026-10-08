import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { AdminLogin } from "@/features/admin/AdminLogin";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.admin.signIn };

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} className="mx-auto max-w-sm px-4 py-20" />}>
      <AdminLogin />
    </Suspense>
  );
}
