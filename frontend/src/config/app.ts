import { COUNTRIES, type CountryCode } from "./countries";

/** Active market. Switch this (or drive it from env) to localise the whole app. */
export const DEFAULT_COUNTRY: CountryCode = "IN";

export const appConfig = {
  country: DEFAULT_COUNTRY,
  currency: COUNTRIES[DEFAULT_COUNTRY].currency,
  locale: COUNTRIES[DEFAULT_COUNTRY].locale,
  /**
   * Temporary: sign in as soon as "Send code" is clicked, without typing the OTP.
   * Only takes effect while the API runs with OTP_DEV_MODE (it returns the code); real SMS
   * deployments fall back to the normal code step. Set NEXT_PUBLIC_OTP_AUTO_LOGIN=false to disable.
   */
  otpAutoLogin: process.env.NEXT_PUBLIC_OTP_AUTO_LOGIN !== "false",
} as const;
