import { appConfig } from "@/config/app";

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** The only place currency symbols are produced. */
export function formatMoney(
  amount: number,
  currency: string = appConfig.currency,
  locale: string = appConfig.locale,
): string {
  const key = `${locale}|${currency}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      minimumFractionDigits: 0,
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

type DateInput = Date | string | number;

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
  locale: string = appConfig.locale,
): string {
  return new Intl.DateTimeFormat(locale, options).format(toDate(value));
}

export function formatTime(value: DateInput, locale: string = appConfig.locale): string {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(
    toDate(value),
  );
}

export function formatDateTime(value: DateInput, locale: string = appConfig.locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(toDate(value));
}

/** "HH:mm" (24h, as stored) → locale display, e.g. "9:00 am". */
export function formatClock(hhmm: string, locale: string = appConfig.locale): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return formatTime(d, locale);
}
