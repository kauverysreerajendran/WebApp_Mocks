import { request, requestBlobUrl } from "./client";
import type {
  AdminStats,
  AdminTailorDetail,
  Availability,
  BankDetails,
  BasicDetails,
  BookingMeta,
  DashboardSummary,
  Executive,
  ExecutiveInput,
  KycDocType,
  OrderCreate,
  OrderDetail,
  OrderDraft,
  OrderListItem,
  OrderStatus,
  OtpRequestResult,
  PaymentsOverview,
  PriceRow,
  Quote,
  SavedMeasurement,
  ServiceDetail,
  ServiceSummary,
  SettlementRow,
  SettlementStatus,
  TailorListItem,
  TailorOption,
  TailorProfile,
  TailorStatus,
  TokenResponse,
  TrackResult,
  User,
  Wallet,
} from "./types";

type PhonePortal = "customer" | "tailor";

export const authApi = {
  requestOtp: (portal: PhonePortal, phone: string, countryCode: string) =>
    request<OtpRequestResult>(`/auth/${portal}/otp/request`, { method: "POST", body: { phone, countryCode } }),
  verifyOtp: (portal: PhonePortal, phone: string, countryCode: string, code: string, name?: string) =>
    request<TokenResponse>(`/auth/${portal}/otp/verify`, {
      method: "POST",
      body: { phone, countryCode, code, name },
    }),
  adminLogin: (email: string, password: string) =>
    request<TokenResponse>("/auth/admin/login", { method: "POST", body: { email, password } }),
  updateProfile: (body: Pick<User, "name" | "email" | "address" | "city" | "postalCode">) =>
    request<User>("/auth/me", { method: "PUT", body, as: "customer" }),
};

export const catalogApi = {
  services: () => request<ServiceSummary[]>("/services"),
  service: (slug: string) => request<ServiceDetail>(`/services/${slug}`),
  bookingMeta: () => request<BookingMeta>("/booking/meta"),
  quote: (draft: OrderDraft) => request<Quote>("/orders/quote", { method: "POST", body: draft }),
};

export const customerApi = {
  placeOrder: (body: OrderCreate) => request<OrderDetail>("/orders", { method: "POST", body, as: "customer" }),
  orders: () => request<OrderListItem[]>("/orders", { as: "customer" }),
  measurements: () => request<SavedMeasurement[]>("/orders/measurements", { as: "customer" }),
  order: (id: number) => request<OrderDetail>(`/orders/${id}`, { as: "customer" }),
  cancel: (id: number) => request<OrderDetail>(`/orders/${id}/cancel`, { method: "POST", as: "customer" }),
};

export type TailorOrderTab = "new" | "active" | "completed" | "all";

export const tailorApi = {
  me: () => request<TailorProfile>("/tailor/me", { as: "tailor" }),
  saveDetails: (body: BasicDetails) =>
    request<TailorProfile>("/tailor/me/details", { method: "PUT", body, as: "tailor" }),
  saveBank: (body: BankDetails) => request<TailorProfile>("/tailor/me/bank", { method: "PUT", body, as: "tailor" }),
  saveAvailability: (body: Availability) =>
    request<TailorProfile>("/tailor/me/availability", { method: "PUT", body, as: "tailor" }),
  uploadDocument: (docType: KycDocType, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<TailorProfile>(`/tailor/me/documents/${docType}`, { method: "POST", body: form, as: "tailor" });
  },
  documentUrl: (docType: KycDocType) => requestBlobUrl(`/tailor/me/documents/${docType}/file`, "tailor"),
  submit: () => request<TailorProfile>("/tailor/me/submit", { method: "POST", as: "tailor" }),
  dashboard: () => request<DashboardSummary>("/tailor/dashboard", { as: "tailor" }),
  orders: (tab: TailorOrderTab) => request<OrderListItem[]>("/tailor/orders", { query: { tab }, as: "tailor" }),
  order: (id: number) => request<OrderDetail>(`/tailor/orders/${id}`, { as: "tailor" }),
  accept: (id: number) => request<OrderDetail>(`/tailor/orders/${id}/accept`, { method: "POST", as: "tailor" }),
  decline: (id: number, reason?: string) =>
    request<void>(`/tailor/orders/${id}/decline`, { method: "POST", body: { reason }, as: "tailor" }),
  advance: (id: number, status: OrderStatus, note?: string) =>
    request<OrderDetail>(`/tailor/orders/${id}/status`, { method: "POST", body: { status, note }, as: "tailor" }),
  pricing: () => request<PriceRow[]>("/tailor/pricing", { as: "tailor" }),
  savePricing: (rows: { packageId: number; price: number }[]) =>
    request<PriceRow[]>("/tailor/pricing", { method: "PUT", body: rows, as: "tailor" }),
  wallet: () => request<Wallet>("/tailor/wallet", { as: "tailor" }),
};

export interface AdminOrderFilters {
  status?: OrderStatus | "";
  q?: string;
  unassigned?: boolean;
  visitsOnly?: boolean;
  openOnly?: boolean;
}

export const adminApi = {
  stats: () => request<AdminStats>("/admin/stats", { as: "admin" }),
  orders: (filters: AdminOrderFilters = {}) =>
    request<OrderListItem[]>("/admin/orders", { query: { ...filters }, as: "admin" }),
  order: (id: number) => request<OrderDetail>(`/admin/orders/${id}`, { as: "admin" }),
  tailorOptions: (id: number) => request<TailorOption[]>(`/admin/orders/${id}/tailor-options`, { as: "admin" }),
  assignTailor: (id: number, tailorId: number) =>
    request<OrderDetail>(`/admin/orders/${id}/assign-tailor`, { method: "POST", body: { tailorId }, as: "admin" }),
  assignExecutive: (id: number, executiveId: number) =>
    request<OrderDetail>(`/admin/orders/${id}/assign-executive`, {
      method: "POST",
      body: { executiveId },
      as: "admin",
    }),
  setStatus: (id: number, status: OrderStatus, note?: string) =>
    request<OrderDetail>(`/admin/orders/${id}/status`, { method: "POST", body: { status, note }, as: "admin" }),
  tailors: (status?: TailorStatus) =>
    request<TailorListItem[]>("/admin/tailors", { query: { status }, as: "admin" }),
  tailor: (id: number) => request<AdminTailorDetail>(`/admin/tailors/${id}`, { as: "admin" }),
  tailorDocumentUrl: (id: number, docType: KycDocType) =>
    requestBlobUrl(`/admin/tailors/${id}/documents/${docType}/file`, "admin"),
  verifyTailor: (id: number, approve: boolean, reason?: string) =>
    request<TailorListItem>(`/admin/tailors/${id}/verify`, { method: "POST", body: { approve, reason }, as: "admin" }),
  executives: () => request<Executive[]>("/admin/executives", { as: "admin" }),
  createExecutive: (body: ExecutiveInput) =>
    request<Executive>("/admin/executives", { method: "POST", body, as: "admin" }),
  updateExecutive: (id: number, body: ExecutiveInput) =>
    request<Executive>(`/admin/executives/${id}`, { method: "PUT", body, as: "admin" }),
  payments: () => request<PaymentsOverview>("/admin/payments", { as: "admin" }),
  updateSettlement: (id: number, status: SettlementStatus, reference?: string) =>
    request<SettlementRow>(`/admin/settlements/${id}`, { method: "PUT", body: { status, reference }, as: "admin" }),
};

export const trackApi = {
  lookup: (orderId: number, phone: string) =>
    request<TrackResult>(`/orders/track/${orderId}`, { query: { phone } }),
};
