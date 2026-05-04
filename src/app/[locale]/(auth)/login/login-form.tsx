"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signInParent } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { error?: string } | null;

export function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<State, FormData>(
    signInParent,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ana@ejemplo.com"
          className="rounded-xl h-12"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="rounded-xl h-12"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-4 py-2">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] hover:opacity-90 transition-opacity"
      >
        {pending ? "Entrando…" : t("signIn")}
      </Button>
    </form>
  );
}
