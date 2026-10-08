import { sessions } from "@/lib/auth/session";
import type { Role } from "./types";

/**
 * API base URL. Set NEXT_PUBLIC_API_URL to an absolute URL to call the API directly, or to "same-origin"
 * to call /api/v1 on the site itself (proxied by next.config.ts) — needed when sharing through a tunnel.
 */
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const API_URL = (
  RAW_API_URL === "same-origin" ? (typeof window === "undefined" ? "http://localhost:3100" : window.location.origin) : RAW_API_URL
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Portal whose session token to send. Omit for public endpoints. */
  as?: Role;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}/api/v1${path}`);
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== false) url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function send(path: string, { method = "GET", body, query, as, signal }: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = as ? sessions[as].get()?.token : undefined;
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    let detail = res.statusText || "Request failed";
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      /* non-JSON error body */
    }
    // Expired or revoked token: sign this portal out so guards redirect to login.
    if (res.status === 401 && as && token) sessions[as].set(null);
    throw new ApiError(res.status, detail);
  }
  return res;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Authenticated file download → object URL (for KYC previews). Caller must revoke it. */
export async function requestBlobUrl(path: string, as: Role): Promise<string> {
  const res = await send(path, { as });
  return URL.createObjectURL(await res.blob());
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Something went wrong. Please try again.";
}
