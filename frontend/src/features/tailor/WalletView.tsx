"use client";

import { Landmark } from "lucide-react";
import { Badge, Card, DataState, EmptyState, Skeleton, StatCard } from "@/components/ui";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import { formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { SETTLEMENT_TONE } from "@/lib/status";

const t = strings.tailor;

/** B13 — Wallet: balance, earnings and Payment Settlement history. */
export function WalletView() {
  const { data, status, reload } = useApi("tailor-wallet", tailorApi.wallet);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {data ? (
          <>
            <div className="col-span-2">
              <StatCard label={t.available} value={formatMoney(data.availableBalance, data.currency)} icon={Landmark} emphasis />
            </div>
            <StatCard label={t.paidOut} value={formatMoney(data.totalPaidOut, data.currency)} />
            <StatCard label={t.lifetime} value={formatMoney(data.lifetimeEarnings, data.currency)} />
          </>
        ) : (
          status !== "error" && (
            <>
              <Skeleton className="col-span-2 h-24 rounded-card" />
              <Skeleton className="h-20 rounded-card" />
              <Skeleton className="h-20 rounded-card" />
            </>
          )
        )}
      </div>
      {data && <p className="text-xs text-muted">{t.feeNote(data.commissionPercent)}</p>}

      <section aria-labelledby="settlements-title">
        <h2 id="settlements-title" className="mb-2.5 text-base font-semibold text-primary">
          {t.settlementHistory}
        </h2>
        <DataState
          status={status}
          data={data?.settlements}
          onRetry={reload}
          empty={<EmptyState icon={Landmark} title={t.noSettlementsTitle} body={t.noSettlementsBody} />}
        >
          {(list) => (
            <Card padding="none">
              <ul className="divide-y divide-border">
                {list.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium text-text">{t.settlementFor(s.orderId)}</span>
                      <span className="text-xs text-muted">
                        {formatDate(s.paidAt ?? s.createdAt)}
                        {s.reference && ` · ${t.ref(s.reference)}`}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-text">{formatMoney(s.net, data!.currency)}</span>
                      <Badge tone={SETTLEMENT_TONE[s.status]}>{strings.status.settlement[s.status]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </DataState>
      </section>
    </div>
  );
}
