/** Mirrors backend/app/schemas (camelCase on the wire). */

export type Role = "customer" | "tailor" | "admin";

export type OrderStatus =
  | "placed"
  | "assigned"
  | "accepted"
  | "measurement_done"
  | "stitching"
  | "ready"
  | "delivered"
  | "cancelled";

export type TailorStatus = "draft" | "pending" | "approved" | "rejected";
export type MeasurementMethod = "self" | "visit";
export type PaymentStatus = "pending" | "paid" | "void";
export type SettlementStatus = "pending" | "processing" | "paid";
export type KycDocType = "aadhaar" | "pan" | "business_proof" | "bank_details";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface User {
  id: number;
  role: Role;
  name: string;
  phone: string | null;
  countryCode: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
}

export interface TokenResponse {
  accessToken: string;
  user: User;
}

export interface OtpRequestResult {
  sent: boolean;
  expiresIn: number;
  devCode: string | null;
}

// ---------- catalogue ----------

export interface ServiceSummary {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string | null;
  isPopular: boolean;
  promoTitle: string | null;
  startingPrice: number;
  packages: Package[];
}

export interface Package {
  id: number;
  slug: string;
  name: string;
  description: string;
  basePrice: number;
}

export interface Option {
  key: string;
  label: string;
  imageUrl: string | null;
  priceDelta: number;
}

export interface OptionGroup {
  key: string;
  label: string;
  kind: "choice" | "toggle";
  togglePrice: number;
  defaultOn: boolean;
  options: Option[];
}

export interface MeasurementField {
  key: string;
  label: string;
}

export interface ServiceDetail extends ServiceSummary {
  optionGroups: OptionGroup[];
  measurementFields: MeasurementField[];
}

export interface BookingMeta {
  visitSlots: string[];
  visitFee: number;
  currency: string;
  maxAdvanceDays: number;
}

// ---------- orders ----------

export interface OrderDraft {
  serviceId: number;
  packageId: number;
  selections: Record<string, string>;
  toggles: Record<string, boolean>;
  measurementMethod: MeasurementMethod;
  measurementUnit?: "cm" | "in" | null;
  measurements?: Record<string, number> | null;
  visitDate?: string | null;
  visitSlot?: string | null;
}

export interface Contact {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
}

export interface OrderCreate extends OrderDraft {
  contact: Contact;
  notes?: string | null;
}

export interface QuoteLine {
  label: string;
  detail: string | null;
  amount: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  packagePrice: number;
  customizationPrice: number;
  visitFee: number;
  total: number;
}

export interface Party {
  id: number;
  name: string;
  phone: string | null;
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  serviceName: string;
  packageName: string;
  customerName: string;
  city: string;
  total: number;
  currency: string;
  measurementMethod: MeasurementMethod;
  visitDate: string | null;
  visitSlot: string | null;
  tailor: Party | null;
  executive: Party | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customization {
  groupKey: string;
  groupLabel: string;
  valueKey: string;
  valueLabel: string;
  price: number;
}

export interface OrderEvent {
  status: OrderStatus;
  actorRole: Role;
  note: string | null;
  createdAt: string;
}

export interface Payment {
  amount: number;
  method: string;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface Settlement {
  id: number;
  orderId: number;
  gross: number;
  commission: number;
  net: number;
  status: SettlementStatus;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface OrderDetail extends OrderListItem {
  customizations: Customization[];
  measurementUnit: string | null;
  measurements: Record<string, number> | null;
  measurementLabels: Record<string, string>;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  postalCode: string;
  countryCode: string;
  notes: string | null;
  packagePrice: number;
  customizationPrice: number;
  visitFee: number;
  events: OrderEvent[];
  payment: Payment | null;
  settlement: Settlement | null;
}

export interface SavedMeasurement {
  orderId: number;
  serviceName: string;
  unit: string;
  values: { key: string; label: string; value: number }[];
  createdAt: string;
}

// ---------- tailor ----------

export interface KycDocument {
  id: number;
  docType: KycDocType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface TailorProfile {
  id: number;
  status: TailorStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  phone: string | null;
  shopName: string;
  ownerName: string;
  email: string | null;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  bankAccountName: string | null;
  bankAccountNumberMasked: string | null;
  bankIfsc: string | null;
  workingDays: Weekday[];
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  documents: KycDocument[];
  missingSteps: ("details" | "kyc" | "availability")[];
}

export interface AdminTailorDetail extends TailorProfile {
  bankAccountNumber: string | null;
}

export interface BasicDetails {
  shopName: string;
  ownerName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface BankDetails {
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
}

export interface Availability {
  workingDays: Weekday[];
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface DashboardSummary {
  newOrders: number;
  activeOrders: number;
  completedOrders: number;
  earnings: number;
  currency: string;
  recentOrders: OrderListItem[];
  unreadNotifications: number;
}

export interface PriceRow {
  packageId: number;
  serviceName: string;
  packageName: string;
  platformPrice: number;
  myPrice: number | null;
}

export interface Wallet {
  currency: string;
  availableBalance: number;
  totalPaidOut: number;
  lifetimeEarnings: number;
  commissionPercent: number;
  settlements: Settlement[];
}

// ---------- admin ----------

export interface AdminStats {
  totalOrders: number;
  unassignedOrders: number;
  activeOrders: number;
  pendingVerifications: number;
  revenue: number;
  pendingSettlements: number;
  currency: string;
}

export interface TailorListItem {
  id: number;
  status: TailorStatus;
  shopName: string;
  ownerName: string;
  phone: string | null;
  city: string;
  submittedAt: string | null;
  activeOrders: number;
  completedOrders: number;
  workingDays: Weekday[];
  openTime: string;
  closeTime: string;
}

export interface TailorOption extends TailorListItem {
  quotedPrice: number | null;
  sameCity: boolean;
}

export interface Executive {
  id: number;
  name: string;
  phone: string;
  area: string;
  isActive: boolean;
  openVisits: number;
}

export interface ExecutiveInput {
  name: string;
  phone: string;
  area: string;
  isActive: boolean;
}

export interface PaymentRow {
  orderId: number;
  customerName: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface SettlementRow extends Settlement {
  tailorId: number;
  shopName: string;
}

export interface PaymentsOverview {
  currency: string;
  collected: number;
  outstanding: number;
  commissionEarned: number;
  settledToTailors: number;
  payments: PaymentRow[];
  settlements: SettlementRow[];
}

/** Public order tracking (order number + booking phone). Progress only — no contact or price data. */
export interface TrackEvent {
  status: OrderStatus;
  createdAt: string;
}

export interface TrackResult {
  id: number;
  status: OrderStatus;
  serviceName: string;
  packageName: string;
  city: string;
  measurementMethod: MeasurementMethod;
  visitDate: string | null;
  visitSlot: string | null;
  tailorName: string | null;
  events: TrackEvent[];
  createdAt: string;
}
