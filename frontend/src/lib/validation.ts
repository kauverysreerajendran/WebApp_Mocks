import { getCountry, type CountryCode } from "@/config/countries";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (v: string) => EMAIL.test(v.trim());
export const isPhone = (v: string, country: CountryCode) => getCountry(country).phonePattern.test(v);
export const isPostal = (v: string, country: CountryCode) => getCountry(country).postalPattern.test(v.trim());
export const isIfsc = (v: string) => /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(v.trim());
export const isAccountNumber = (v: string) => /^\d{6,20}$/.test(v.trim());

/** Returns the error map with undefined entries removed; empty object means valid. */
export function compact<K extends string>(errors: Partial<Record<K, string | undefined>>): Partial<Record<K, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v))) as Partial<Record<K, string>>;
}
