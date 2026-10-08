import type { KycDocType } from "@/lib/api/types";

/** India KYC set (see config/countries.ts for other markets' labels). Order matches the client workflow. */
export const KYC_DOCS: KycDocType[] = ["aadhaar", "pan", "business_proof", "bank_details"];

/**
 * Opens an authenticated document in a new tab. The tab is opened synchronously
 * (so pop-up blockers allow it) and pointed at the blob once downloaded.
 */
export async function openDocument(load: () => Promise<string>): Promise<void> {
  const win = window.open("", "_blank");
  try {
    const url = await load();
    if (win) win.location.href = url;
    else window.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    win?.close();
    throw err;
  }
}
