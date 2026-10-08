"use client";

import { Banknote, Landmark, Plus, ReceiptText, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DataState,
  DescriptionList,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  ListSkeleton,
  Modal,
  PageHeader,
  Skeleton,
  StatCard,
  Table,
  Textarea,
  useToast,
  type Column,
} from "@/components/ui";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { adminApi } from "@/lib/api/endpoints";
import type { Executive, ExecutiveInput, PaymentRow, SettlementRow, TailorListItem, TailorStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { PAYMENT_TONE, SETTLEMENT_TONE, TAILOR_TONE } from "@/lib/status";
import { compact, isPhone } from "@/lib/validation";
import { KYC_DOCS, openDocument } from "@/features/tailor/documents";
import { AdminOrderDrawer } from "./AdminOrderDrawer";

const a = strings.admin;
const c = a.cols;

// ---------- View Payments ----------

export function AdminPayments() {
  const toast = useToast();
  const { data, status, reload } = useApi("admin-payments", adminApi.payments);
  const [openOrder, setOpenOrder] = useState<number | null>(null);
  const [settling, setSettling] = useState<SettlementRow | null>(null);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const markProcessing = async (s: SettlementRow) => {
    setBusyId(s.id);
    try {
      await adminApi.updateSettlement(s.id, "processing");
      toast.success(a.settlementUpdated);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async () => {
    if (!settling) return;
    setSaving(true);
    try {
      await adminApi.updateSettlement(settling.id, "paid", reference.trim());
      toast.success(a.settlementUpdated);
      setSettling(null);
      setReference("");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const payCols: Column<PaymentRow>[] = [
    { key: "order", header: c.order, cell: (p) => <span className="font-semibold text-primary">{strings.common.orderNo(p.orderId)}</span> },
    { key: "customer", header: c.customer, cell: (p) => p.customerName },
    { key: "method", header: c.method, hideBelow: "md", cell: () => a.payOnDelivery },
    { key: "status", header: c.status, cell: (p) => <Badge tone={PAYMENT_TONE[p.status]}>{strings.status.payment[p.status]}</Badge> },
    { key: "paid", header: c.paidAt, hideBelow: "lg", cell: (p) => (p.paidAt ? formatDate(p.paidAt) : strings.common.na) },
    { key: "amount", header: c.amount, align: "right", cell: (p) => formatMoney(p.amount, p.currency) },
  ];

  const setCols: Column<SettlementRow>[] = [
    { key: "order", header: c.order, cell: (s) => <span className="font-semibold text-primary">{strings.common.orderNo(s.orderId)}</span> },
    { key: "shop", header: c.shop, cell: (s) => s.shopName },
    { key: "gross", header: c.gross, align: "right", hideBelow: "md", cell: (s) => formatMoney(s.gross) },
    { key: "fee", header: c.commission, align: "right", hideBelow: "md", cell: (s) => formatMoney(s.commission) },
    { key: "net", header: c.net, align: "right", cell: (s) => <span className="font-semibold">{formatMoney(s.net)}</span> },
    {
      key: "status",
      header: c.status,
      cell: (s) => (
        <span className="flex flex-col gap-1">
          <Badge tone={SETTLEMENT_TONE[s.status]}>{strings.status.settlement[s.status]}</Badge>
          {s.reference && <span className="text-xs text-muted">{s.reference}</span>}
        </span>
      ),
    },
    {
      key: "action",
      header: c.action,
      align: "right",
      cell: (s) =>
        s.status === "paid" ? (
          <span className="text-xs text-muted">{s.paidAt ? formatDate(s.paidAt) : ""}</span>
        ) : (
          <span className="inline-flex gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            {s.status === "pending" && (
              <Button size="sm" variant="secondary" loading={busyId === s.id} onClick={() => markProcessing(s)}>
                {a.markProcessing}
              </Button>
            )}
            <Button size="sm" onClick={() => setSettling(s)}>
              {a.markPaid}
            </Button>
          </span>
        ),
    },
  ];

  return (
    <>
      <PageHeader title={a.paymentsTitle} />
      {status === "error" ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data ? (
            <>
              <StatCard label={a.collected} value={formatMoney(data.collected, data.currency)} icon={Banknote} />
              <StatCard label={a.outstanding} value={formatMoney(data.outstanding, data.currency)} icon={ReceiptText} />
              <StatCard label={a.commissionEarned} value={formatMoney(data.commissionEarned, data.currency)} icon={Wallet} emphasis />
              <StatCard label={a.settled} value={formatMoney(data.settledToTailors, data.currency)} icon={Landmark} />
            </>
          ) : (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
          )}
        </div>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-primary">{a.tailorSettlements}</h2>
        <Table
          caption={a.tailorSettlements}
          columns={setCols}
          rows={data?.settlements}
          rowKey={(s) => String(s.id)}
          status={status}
          onRetry={reload}
          onRowClick={(s) => setOpenOrder(s.orderId)}
          empty={<EmptyState title={a.noSettlementsTitle} body={a.noSettlementsBody} />}
        />
      </section>
      <section>
        <h2 className="mb-3 text-base font-semibold text-primary">{a.customerPayments}</h2>
        <Table
          caption={a.customerPayments}
          columns={payCols}
          rows={data?.payments}
          rowKey={(p) => String(p.orderId)}
          status={status}
          onRetry={reload}
          onRowClick={(p) => setOpenOrder(p.orderId)}
          empty={<EmptyState title={a.noPaymentsTitle} body={a.noPaymentsBody} />}
        />
      </section>

      <AdminOrderDrawer orderId={openOrder} onClose={() => setOpenOrder(null)} />
      <Modal
        open={settling !== null}
        onClose={() => setSettling(null)}
        title={settling ? a.settleTitle(settling.orderId) : ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSettling(null)}>
              {strings.common.cancel}
            </Button>
            <Button onClick={markPaid} loading={saving} disabled={!reference.trim()}>
              {a.markPaid}
            </Button>
          </>
        }
      >
        {settling && (
          <div className="flex flex-col gap-4">
            <DescriptionList
              items={[
                { label: c.shop, value: settling.shopName },
                { label: c.net, value: formatMoney(settling.net) },
              ]}
            />
            <Input label={a.referenceLabel} value={reference} onChange={(e) => setReference(e.target.value)} autoComplete="off" />
          </div>
        )}
      </Modal>
    </>
  );
}

// ---------- C3 Tailor Verification ----------

function TailorReview({ id, onClose, onDecided }: { id: number; onClose: () => void; onDecided: () => void }) {
  const toast = useToast();
  const { data: t, status, reload } = useApi(`admin-tailor:${id}`, () => adminApi.tailor(id));
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const decide = async (approve: boolean) => {
    if (!approve && !reason.trim()) {
      setReasonError(strings.validation.required(a.rejectReason));
      return;
    }
    setSaving(true);
    try {
      await adminApi.verifyTailor(id, approve, approve ? undefined : reason.trim());
      toast.success(approve ? a.approved : a.rejected);
      onDecided();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const pending = t?.status === "pending";
  const docs = new Map((t?.documents ?? []).map((d) => [d.docType, d]));

  return (
    <Drawer
      open
      onClose={onClose}
      title={t?.shopName ?? a.review}
      footer={
        pending && (
          <>
            {rejecting ? (
              <Button variant="danger" onClick={() => decide(false)} loading={saving}>
                {a.reject}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setRejecting(true)}>
                {a.reject}
              </Button>
            )}
            <Button onClick={() => decide(true)} loading={saving && !rejecting} disabled={saving}>
              {a.approve}
            </Button>
          </>
        )
      }
    >
      {status === "error" && <ErrorState onRetry={reload} />}
      {!t && status !== "error" && <ListSkeleton rows={3} />}
      {t && (
        <div className="flex flex-col gap-5">
          <Badge tone={TAILOR_TONE[t.status]} className="w-fit">
            {strings.status.tailor[t.status]}
          </Badge>
          {t.rejectionReason && (
            <p className="rounded-control bg-error-soft p-3 text-sm text-error">
              {strings.tailor.reason}: {t.rejectionReason}
            </p>
          )}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary">{strings.tailor.detailsTitle}</h3>
            <DescriptionList
              items={[
                { label: strings.tailor.ownerName, value: t.ownerName },
                { label: strings.fields.phone, value: t.phone },
                { label: strings.fields.email, value: t.email },
                { label: strings.tailor.shopAddress, value: `${t.address}, ${t.city} ${t.postalCode}` },
                { label: c.submitted, value: t.submittedAt ? formatDateTime(t.submittedAt) : strings.common.na },
              ]}
            />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary">{strings.tailor.kycTitle}</h3>
            <ul className="divide-y divide-border rounded-card border border-border">
              {KYC_DOCS.map((doc) => (
                <li key={doc} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <span className="flex flex-col">
                    <span className="font-medium text-text">{strings.kyc[doc]}</span>
                    {docs.get(doc) && <span className="text-xs text-muted">{docs.get(doc)!.fileName}</span>}
                  </span>
                  {docs.has(doc) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openDocument(() => adminApi.tailorDocumentUrl(id, doc)).catch((e) => toast.error(errorMessage(e)))}
                    >
                      {a.viewDocument}
                    </Button>
                  ) : (
                    <Badge tone="error">{a.docMissing}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary">{strings.tailor.bankTitle}</h3>
            <DescriptionList
              items={[
                { label: strings.tailor.accountName, value: t.bankAccountName },
                { label: strings.tailor.accountNumber, value: t.bankAccountNumber },
                { label: strings.tailor.ifsc, value: t.bankIfsc },
              ]}
            />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary">{strings.tailor.availabilityTitle}</h3>
            <DescriptionList
              items={[
                { label: strings.tailor.workingDays, value: t.workingDays.map((d) => strings.weekdays[d]).join(", ") },
                { label: strings.tailor.hoursLabel, value: `${formatClock(t.openTime)} – ${formatClock(t.closeTime)}` },
              ]}
            />
          </section>
          {pending && rejecting && (
            <Textarea
              label={a.rejectReason}
              hint={a.rejectReasonHint}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(undefined);
              }}
              error={reasonError}
              autoFocus
            />
          )}
        </div>
      )}
    </Drawer>
  );
}

const VERIFY_TABS: TailorStatus[] = ["pending", "approved", "rejected"];

export function TailorVerification() {
  const [tab, setTab] = useState<TailorStatus>("pending");
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const { data, status, reload } = useApi(`admin-tailors:${tab}:${refresh}`, () => adminApi.tailors(tab));

  const cols: Column<TailorListItem>[] = [
    {
      key: "shop",
      header: c.shop,
      cell: (t) => (
        <span className="flex flex-col">
          <span className="font-semibold text-primary">{t.shopName}</span>
          <span className="text-xs text-muted">{t.ownerName}</span>
        </span>
      ),
    },
    { key: "phone", header: c.phone, hideBelow: "md", cell: (t) => t.phone },
    { key: "city", header: c.city, cell: (t) => t.city },
    { key: "submitted", header: c.submitted, hideBelow: "lg", cell: (t) => (t.submittedAt ? formatDate(t.submittedAt) : strings.common.na) },
    ...(tab === "approved"
      ? [
          { key: "active", header: c.active, align: "right" as const, cell: (t: TailorListItem) => t.activeOrders },
          { key: "completed", header: c.completed, align: "right" as const, hideBelow: "md" as const, cell: (t: TailorListItem) => t.completedOrders },
        ]
      : []),
    {
      key: "action",
      header: c.action,
      align: "right",
      cell: () => (
        <Button size="sm" variant={tab === "pending" ? "primary" : "secondary"} tabIndex={-1}>
          {a.review}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={a.verificationTitle} lead={a.verificationLead} />
      <div role="tablist" aria-label={a.verificationTitle} className="mb-4 flex gap-1 border-b border-border">
        {VERIFY_TABS.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-ring",
              tab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-primary",
            )}
          >
            {a.tabs[key as keyof typeof a.tabs]}
          </button>
        ))}
      </div>
      <Table
        caption={a.verificationTitle}
        columns={cols}
        rows={data}
        rowKey={(t) => String(t.id)}
        status={status}
        onRetry={reload}
        onRowClick={(t) => setReviewing(t.id)}
        empty={<EmptyState title={a.noTailorsInTabTitle} body={a.noTailorsInTabBody} />}
      />
      {reviewing !== null && (
        <TailorReview
          id={reviewing}
          onClose={() => setReviewing(null)}
          onDecided={() => {
            setReviewing(null);
            setRefresh((n) => n + 1);
          }}
        />
      )}
    </>
  );
}

// ---------- Executives ----------

const emptyExec: ExecutiveInput = { name: "", phone: "", area: "", isActive: true };

function ExecutiveForm({ initial, onSave, onClose }: { initial: Executive | null; onSave: (v: ExecutiveInput) => Promise<void>; onClose: () => void }) {
  const [v, setV] = useState<ExecutiveInput>(initial ? { name: initial.name, phone: initial.phone, area: initial.area, isActive: initial.isActive } : emptyExec);
  const [errors, setErrors] = useState<Partial<Record<keyof ExecutiveInput, string>>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = compact({
      name: v.name.trim().length < 2 ? strings.validation.required(strings.fields.name) : undefined,
      phone: !isPhone(v.phone, "IN") ? strings.validation.phone : undefined,
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await onSave({ ...v, name: v.name.trim(), area: v.area.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={initial ? a.editExecutive : a.addExecutive} size="sm">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input label={strings.fields.name} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} />
        <Input
          label={strings.fields.phone}
          inputMode="tel"
          value={v.phone}
          onChange={(e) => setV({ ...v, phone: e.target.value.replace(/\D/g, "") })}
          error={errors.phone}
        />
        <Input label={c.area} optional value={v.area} onChange={(e) => setV({ ...v, area: e.target.value })} />
        <Checkbox label={a.activeLabel} checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function Executives() {
  const toast = useToast();
  const { data, status, reload } = useApi("admin-executives", adminApi.executives);
  const [editing, setEditing] = useState<Executive | null | "new">(null);

  const save = async (v: ExecutiveInput) => {
    try {
      if (editing === "new") await adminApi.createExecutive(v);
      else if (editing) await adminApi.updateExecutive(editing.id, v);
      toast.success(strings.common.saved);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title={a.executivesTitle}
        lead={a.executivesLead}
        actions={
          <Button leftIcon={<Plus size={16} aria-hidden />} onClick={() => setEditing("new")}>
            {a.addExecutive}
          </Button>
        }
      />
      <DataState status={status} data={data} onRetry={reload}>
        {(list) => (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.map((ex) => (
              <li key={ex.id}>
                <Card className="flex h-full flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{ex.name}</p>
                      <p className="text-xs text-muted">{ex.area || strings.common.na}</p>
                    </div>
                    <Badge tone={ex.isActive ? "success" : "neutral"}>{ex.isActive ? a.activeLabel : a.inactive}</Badge>
                  </div>
                  <p className="text-sm">{ex.phone}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5">
                    <span className="text-xs text-muted">
                      {c.openVisits}: <span className="font-semibold text-text">{ex.openVisits}</span>
                    </span>
                    <Button variant="text" size="sm" onClick={() => setEditing(ex)}>
                      {strings.common.edit}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </DataState>
      {editing && <ExecutiveForm initial={editing === "new" ? null : editing} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
