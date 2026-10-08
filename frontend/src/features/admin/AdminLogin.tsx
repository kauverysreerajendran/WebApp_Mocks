"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/nav/Logo";
import { Button, Input, Photo } from "@/components/ui";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/endpoints";
import { sessions, useSession } from "@/lib/auth/session";

const a = strings.admin;

function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : routes.admin.root;
}

/** C1 — Admin login (email + password). */
export function AdminLogin() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const session = useSession("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, router, next]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(strings.validation.required(`${strings.fields.email} / ${a.password}`));
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const res = await authApi.adminLogin(email.trim(), password);
      sessions.admin.set({ token: res.accessToken, user: res.user });
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-2">
      <div className="relative hidden bg-blush lg:block">
        <Photo image={media.workshop} className="absolute inset-0 bg-blush" imgClassName="opacity-90" sizes="50vw" priority />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-primary)_5%,transparent_65%)]" />
        <div className="absolute inset-x-10 bottom-10 flex flex-col gap-2">
          <p className="eyebrow text-highlight">{strings.brand.adminConsole}</p>
          <p className="max-w-md text-xl font-semibold text-on-ink">{a.loginLead}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Logo href={routes.home} className="mb-8" />
          <h1 className="mb-1 text-2xl font-semibold text-primary">{a.loginTitle}</h1>
          <p className="mb-6 text-sm text-muted">{a.loginLead}</p>
          <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
            <Input
              label={strings.fields.email}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label={a.password}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
            <Button type="submit" fullWidth loading={pending}>
              {a.signIn}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
