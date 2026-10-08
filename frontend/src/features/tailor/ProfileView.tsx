"use client";

import { CalendarDays, ChevronRight, LogOut, Tags } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, DescriptionList, SectionTitle, useToast } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { tailorApi } from "@/lib/api/endpoints";
import { sessions } from "@/lib/auth/session";
import { formatClock } from "@/lib/format";
import { TAILOR_TONE } from "@/lib/status";
import { KYC_DOCS, openDocument } from "./documents";
import { useTailor } from "./TailorContext";

const t = strings.tailor;

/** B14 — Profile: shop details, KYC status, settings links, logout. */
export function ProfileView() {
  const { profile } = useTailor();
  const router = useRouter();
  const toast = useToast();
  const docs = new Map(profile.documents.map((d) => [d.docType, d]));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionTitle>{t.shopDetails}</SectionTitle>
        <DescriptionList
          items={[
            { label: t.shopName, value: profile.shopName },
            { label: t.ownerName, value: profile.ownerName },
            { label: strings.fields.phone, value: profile.phone },
            { label: strings.fields.email, value: profile.email },
            { label: t.shopAddress, value: `${profile.address}, ${profile.city} ${profile.postalCode}` },
            { label: t.bank, value: `${profile.bankAccountNumberMasked ?? strings.common.na} · ${profile.bankIfsc ?? ""}` },
          ]}
        />
      </Card>

      <Card>
        <SectionTitle action={<Badge tone={TAILOR_TONE[profile.status]}>{strings.status.tailor[profile.status]}</Badge>}>
          {t.kycStatus}
        </SectionTitle>
        <ul className="divide-y divide-border">
          {KYC_DOCS.map((doc) => (
            <li key={doc} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="text-text">{strings.kyc[doc]}</span>
              {docs.has(doc) ? (
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => openDocument(() => tailorApi.documentUrl(doc)).catch((e) => toast.error(errorMessage(e)))}
                >
                  {strings.common.view}
                </Button>
              ) : (
                <Badge tone="error">{strings.admin.docMissing}</Badge>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="none">
        {[
          {
            href: routes.tailor.availability,
            icon: CalendarDays,
            label: strings.nav.tailor.availability,
            meta: `${profile.workingDays.map((d) => strings.weekdays[d]).join(", ")} · ${formatClock(profile.openTime)}–${formatClock(profile.closeTime)}`,
          },
          { href: routes.tailor.pricing, icon: Tags, label: strings.nav.tailor.pricing, meta: t.pricingLead },
        ].map(({ href, icon: Icon, label, meta }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface-muted focus-ring"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Icon size={16} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium text-text">{label}</span>
              <span className="truncate text-xs text-muted">{meta}</span>
            </span>
            <ChevronRight size={16} aria-hidden className="text-muted" />
          </Link>
        ))}
      </Card>

      <Button
        variant="secondary"
        fullWidth
        leftIcon={<LogOut size={16} aria-hidden />}
        onClick={() => {
          sessions.tailor.set(null);
          router.replace(routes.tailor.root);
        }}
      >
        {strings.common.logout}
      </Button>
    </div>
  );
}
