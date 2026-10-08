import { useSyncExternalStore } from "react";
import type { Role, User } from "@/lib/api/types";

export interface Session {
  token: string;
  user: User;
}

/**
 * One tiny external store per portal (customer / tailor / admin) backed by localStorage.
 * useSyncExternalStore keeps SSR and hydration consistent: the server snapshot is
 * `undefined` ("not known yet"), so guards wait instead of redirecting early.
 */
export interface SessionStore {
  get: () => Session | null;
  set: (session: Session | null) => void;
  subscribe: (listener: () => void) => () => void;
}

function createSessionStore(role: Role): SessionStore {
  const key = `tt.session.${role}`;
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: Session | null = null;

  const read = (): Session | null => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = null;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? (JSON.parse(raw) as Session) : null;
      } catch {
        cachedValue = null;
      }
    }
    return cachedValue;
  };

  const notify = () => listeners.forEach((l) => l());

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) notify();
    });
  }

  return {
    get: read,
    set(session) {
      try {
        if (session) window.localStorage.setItem(key, JSON.stringify(session));
        else window.localStorage.removeItem(key);
      } catch {
        /* storage unavailable — session lives for this page only */
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const sessions: Record<Role, SessionStore> = {
  customer: createSessionStore("customer"),
  tailor: createSessionStore("tailor"),
  admin: createSessionStore("admin"),
};

/** `undefined` while hydrating, `null` when signed out. */
export function useSession(role: Role): Session | null | undefined {
  const store = sessions[role];
  return useSyncExternalStore(store.subscribe, store.get, () => undefined);
}
