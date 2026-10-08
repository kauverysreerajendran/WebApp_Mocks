/**
 * Per-country configuration. Adding a market = adding an entry here.
 * Labels are string keys resolved through the strings file so they stay translatable.
 */

export type CountryCode = "IN" | "AE" | "GB" | "US";

export interface KycDocumentConfig {
  id: string;
  /** key into strings.kyc.documents */
  labelKey: "aadhaar" | "pan" | "businessProof" | "bankDetails" | "nationalId" | "tradeLicense";
  accept: string;
  required: boolean;
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  dialCode: string;
  currency: string;
  locale: string;
  /** "pincode" for India, "postalCode" elsewhere */
  postalLabelKey: "pincode" | "postalCode";
  postalPattern: RegExp;
  phonePattern: RegExp;
  kycDocuments: KycDocumentConfig[];
}

const DOC_ACCEPT = "image/jpeg,image/png,application/pdf";

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  IN: {
    code: "IN",
    name: "India",
    dialCode: "+91",
    currency: "INR",
    locale: "en-IN",
    postalLabelKey: "pincode",
    postalPattern: /^[1-9]\d{5}$/,
    phonePattern: /^[6-9]\d{9}$/,
    kycDocuments: [
      { id: "aadhaar", labelKey: "aadhaar", accept: DOC_ACCEPT, required: true },
      { id: "pan", labelKey: "pan", accept: DOC_ACCEPT, required: true },
      { id: "business-proof", labelKey: "businessProof", accept: DOC_ACCEPT, required: true },
      { id: "bank-details", labelKey: "bankDetails", accept: DOC_ACCEPT, required: true },
    ],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    currency: "AED",
    locale: "en-AE",
    postalLabelKey: "postalCode",
    postalPattern: /^.{0,10}$/,
    phonePattern: /^5\d{8}$/,
    kycDocuments: [
      { id: "national-id", labelKey: "nationalId", accept: DOC_ACCEPT, required: true },
      { id: "trade-license", labelKey: "tradeLicense", accept: DOC_ACCEPT, required: true },
      { id: "bank-details", labelKey: "bankDetails", accept: DOC_ACCEPT, required: true },
    ],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    currency: "GBP",
    locale: "en-GB",
    postalLabelKey: "postalCode",
    postalPattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    phonePattern: /^7\d{9}$/,
    kycDocuments: [
      { id: "national-id", labelKey: "nationalId", accept: DOC_ACCEPT, required: true },
      { id: "business-proof", labelKey: "businessProof", accept: DOC_ACCEPT, required: true },
      { id: "bank-details", labelKey: "bankDetails", accept: DOC_ACCEPT, required: true },
    ],
  },
  US: {
    code: "US",
    name: "United States",
    dialCode: "+1",
    currency: "USD",
    locale: "en-US",
    postalLabelKey: "postalCode",
    postalPattern: /^\d{5}(-\d{4})?$/,
    phonePattern: /^\d{10}$/,
    kycDocuments: [
      { id: "national-id", labelKey: "nationalId", accept: DOC_ACCEPT, required: true },
      { id: "business-proof", labelKey: "businessProof", accept: DOC_ACCEPT, required: true },
      { id: "bank-details", labelKey: "bankDetails", accept: DOC_ACCEPT, required: true },
    ],
  },
};

export const COUNTRY_LIST: CountryConfig[] = Object.values(COUNTRIES);

export function getCountry(code: CountryCode): CountryConfig {
  return COUNTRIES[code];
}
