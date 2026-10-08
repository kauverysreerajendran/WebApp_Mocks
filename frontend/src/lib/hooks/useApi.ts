"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/client";
import type { AsyncStatus } from "@/components/ui";

interface Result<T> {
  key: string;
  data?: T;
  error?: string;
}

export interface ApiState<T> {
  data: T | undefined;
  status: AsyncStatus;
  error: string | undefined;
  reload: () => void;
  /** Replace data locally after a mutation returned the fresh value. */
  setData: (data: T) => void;
}

/**
 * Minimal fetch-on-mount hook. `key` identifies the request; pass `null` to skip.
 * Status is derived (result.key !== key ⇒ loading) so no state is set synchronously in effects.
 */
export function useApi<T>(key: string | null, fetcher: () => Promise<T>): ApiState<T> {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [nonce, setNonce] = useState(0);
  const requestKey = key === null ? null : `${key}#${nonce}`;

  useEffect(() => {
    if (requestKey === null) return;
    let active = true;
    fetcher().then(
      (data) => active && setResult({ key: requestKey, data }),
      (err) => active && setResult({ key: requestKey, error: errorMessage(err) }),
    );
    return () => {
      active = false;
    };
    // `fetcher` is intentionally excluded: callers pass inline closures and `key` captures their inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const current = result && result.key === requestKey ? result : null;
  // Keep showing the previous data while a reload is in flight.
  const data = current?.data ?? (result?.key.split("#")[0] === key ? result?.data : undefined);
  const status: AsyncStatus = current ? (current.error ? "error" : "success") : data !== undefined ? "success" : "loading";

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (value: T) => setResult((prev) => ({ key: prev?.key ?? `${key}#${nonce}`, data: value })),
    [key, nonce],
  );

  return { data, status: requestKey === null ? "loading" : status, error: current?.error, reload, setData };
}

/** Wraps an async action with pending + error state for buttons and forms. */
export function useAction<A extends unknown[], R>(action: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true);
      setError(undefined);
      try {
        return await action(...args);
      } catch (err) {
        setError(errorMessage(err));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, clearError: () => setError(undefined) };
}
