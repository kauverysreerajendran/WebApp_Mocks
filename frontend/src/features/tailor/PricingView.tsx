"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorState, ListSkeleton, useToast } from "@/components/ui";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { tailorApi } from "@/lib/api/endpoints";
import type { PriceRow } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";

const t = strings.tailor;

function PricingForm({ rows, onSaved }: { rows: PriceRow[]; onSaved: (rows: PriceRow[]) => void }) {
  const toast = useToast();
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.packageId, r.myPrice === null ? "" : String(r.myPrice)])),
  );
  const [saving, setSaving] = useState(false);
  const groups = rows.reduce<Record<string, PriceRow[]>>((acc, r) => {
    (acc[r.serviceName] ??= []).push(r);
    return acc;
  }, {});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = rows
      .filter((r) => values[r.packageId]?.trim())
      .map((r) => ({ packageId: r.packageId, price: Math.round(Number(values[r.packageId])) }))
      .filter((r) => Number.isFinite(r.price) && r.price >= 0);
    setSaving(true);
    try {
      onSaved(await tailorApi.savePricing(payload));
      toast.success(t.pricingSaved);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      {Object.entries(groups).map(([service, list]) => (
        <Card key={service} padding="sm" className="md:p-4">
          <h2 className="mb-2 text-base font-semibold text-primary">{service}</h2>
          <div className="flex flex-col divide-y divide-border">
            {list.map((r) => {
              const id = `price-${r.packageId}`;
              return (
                <div key={r.packageId} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <label htmlFor={id} className="flex flex-col">
                    <span className="font-medium text-text">{r.packageName}</span>
                    <span className="text-xs text-muted">
                      {t.platformPrice}: {formatMoney(r.platformPrice)}
                    </span>
                  </label>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted" aria-hidden>
                      {t.myPrice}
                    </span>
                    <input
                      id={id}
                      inputMode="numeric"
                      aria-label={`${t.myPrice} – ${r.packageName}`}
                      placeholder={String(r.platformPrice)}
                      value={values[r.packageId] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [r.packageId]: e.target.value.replace(/\D/g, "").slice(0, 7) }))
                      }
                      className="h-9 w-24 rounded-control border border-border-strong bg-surface px-3 text-right text-sm focus-ring hover:border-accent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      <Button type="submit" loading={saving} className="sticky bottom-20 self-end shadow-card">
        {strings.common.save}
      </Button>
    </form>
  );
}

/** B12 — Pricing Management. */
export function PricingView() {
  const { data, status, reload, setData } = useApi("tailor-pricing", tailorApi.pricing);
  if (status === "loading") return <ListSkeleton rows={4} />;
  if (status === "error" || !data) return <ErrorState onRetry={reload} />;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t.pricingLead}</p>
      <PricingForm rows={data} onSaved={setData} />
    </div>
  );
}
