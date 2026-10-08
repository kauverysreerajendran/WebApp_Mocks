import { DEFAULT_COUNTRY } from "@/config/app";
import type { CountryCode } from "@/config/countries";
import type { MeasurementMethod, OptionGroup, OrderCreate, OrderDraft, ServiceDetail } from "@/lib/api/types";

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;
export const STEP = { service: 0, package: 1, design: 2, measurements: 3, details: 4, summary: 5 } as const;

export interface ContactState {
  name: string;
  phone: string;
  phoneCountry: CountryCode;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: CountryCode;
}

export interface BookingState {
  step: StepIndex;
  serviceSlug: string | null;
  packageId: number | null;
  selections: Record<string, string>;
  toggles: Record<string, boolean>;
  method: MeasurementMethod | null;
  unit: "cm" | "in";
  measurements: Record<string, string>;
  visitDate: string | null; // yyyy-mm-dd
  visitSlot: string | null;
  contact: ContactState;
  notes: string;
}

export const emptyContact: ContactState = {
  name: "",
  phone: "",
  phoneCountry: DEFAULT_COUNTRY,
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: DEFAULT_COUNTRY,
};

export const initialState: BookingState = {
  step: 0,
  serviceSlug: null,
  packageId: null,
  selections: {},
  toggles: {},
  method: null,
  unit: "in",
  measurements: {},
  visitDate: null,
  visitSlot: null,
  contact: emptyContact,
  notes: "",
};

export type Action =
  | { type: "goto"; step: StepIndex }
  | { type: "selectService"; slug: string }
  | { type: "selectPackage"; id: number }
  | { type: "select"; group: string; option: string }
  | { type: "toggle"; group: string; value: boolean }
  | { type: "method"; method: MeasurementMethod }
  | { type: "unit"; unit: "cm" | "in" }
  | { type: "measurement"; key: string; value: string }
  | { type: "visit"; date?: string | null; slot?: string | null }
  | { type: "contact"; patch: Partial<ContactState> }
  | { type: "notes"; value: string }
  | { type: "reset" };

export function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case "goto":
      return { ...state, step: action.step };
    case "selectService":
      if (action.slug === state.serviceSlug) return state;
      // A different service invalidates every downstream choice except contact details.
      return { ...initialState, contact: state.contact, notes: state.notes, step: state.step, serviceSlug: action.slug };
    case "selectPackage":
      return { ...state, packageId: action.id };
    case "select":
      return { ...state, selections: { ...state.selections, [action.group]: action.option } };
    case "toggle":
      return { ...state, toggles: { ...state.toggles, [action.group]: action.value } };
    case "method":
      return { ...state, method: action.method };
    case "unit":
      return { ...state, unit: action.unit };
    case "measurement":
      return { ...state, measurements: { ...state.measurements, [action.key]: action.value } };
    case "visit":
      return {
        ...state,
        visitDate: action.date !== undefined ? action.date : state.visitDate,
        visitSlot: action.slot !== undefined ? action.slot : state.visitSlot,
      };
    case "contact":
      return { ...state, contact: { ...state.contact, ...action.patch } };
    case "notes":
      return { ...state, notes: action.value };
    case "reset":
      return initialState;
  }
}

// ---------- persistence (sessionStorage: survives refresh, not new tabs) ----------

const STORAGE_KEY = "tt.booking";

export function loadState(): BookingState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...(JSON.parse(raw) as BookingState) };
  } catch {
    /* ignore */
  }
  return initialState;
}

export function saveState(state: BookingState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearState() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------- derived helpers ----------

export const isToggleOn = (state: BookingState, group: OptionGroup) => state.toggles[group.key] ?? group.defaultOn;

export const MEASUREMENT_MAX = { cm: 400, in: 160 } as const;

export function measurementErrors(state: BookingState, service: ServiceDetail): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of service.measurementFields) {
    const raw = state.measurements[f.key]?.trim();
    const n = Number(raw);
    if (!raw) errors[f.key] = "required";
    else if (!Number.isFinite(n) || n <= 0 || n > MEASUREMENT_MAX[state.unit]) errors[f.key] = "invalid";
  }
  return errors;
}

/** Client-side estimate mirroring backend pricing; the summary step shows the server quote. */
export function estimateTotal(state: BookingState, service: ServiceDetail | undefined, visitFee: number): number | null {
  if (!service) return null;
  const pkg = service.packages.find((p) => p.id === state.packageId);
  if (!pkg) return null;
  let total = pkg.basePrice;
  for (const g of service.optionGroups) {
    if (g.kind === "choice") {
      total += g.options.find((o) => o.key === state.selections[g.key])?.priceDelta ?? 0;
    } else if (isToggleOn(state, g)) {
      total += g.togglePrice;
    }
  }
  if (state.method === "visit") total += visitFee;
  return total;
}

export function toDraft(state: BookingState, service: ServiceDetail): OrderDraft {
  const visit = state.method === "visit";
  const choiceKeys = new Set(service.optionGroups.filter((g) => g.kind === "choice").map((g) => g.key));
  return {
    serviceId: service.id,
    packageId: state.packageId!,
    selections: Object.fromEntries(Object.entries(state.selections).filter(([k]) => choiceKeys.has(k))),
    toggles: Object.fromEntries(
      service.optionGroups.filter((g) => g.kind === "toggle").map((g) => [g.key, isToggleOn(state, g)]),
    ),
    measurementMethod: state.method ?? "self",
    measurementUnit: visit ? null : state.unit,
    measurements: visit
      ? null
      : Object.fromEntries(service.measurementFields.map((f) => [f.key, Number(state.measurements[f.key])])),
    visitDate: visit ? state.visitDate : null,
    visitSlot: visit ? state.visitSlot : null,
  };
}

export function toOrderPayload(state: BookingState, service: ServiceDetail): OrderCreate {
  return {
    ...toDraft(state, service),
    contact: {
      name: state.contact.name.trim(),
      phone: state.contact.phone,
      email: state.contact.email.trim(),
      address: state.contact.address.trim(),
      city: state.contact.city.trim(),
      postalCode: state.contact.postalCode.trim(),
      countryCode: state.contact.country,
    },
    notes: state.notes.trim() || null,
  };
}
