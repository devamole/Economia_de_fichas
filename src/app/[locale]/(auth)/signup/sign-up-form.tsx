"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signUpParent } from "@/server/actions/auth";
import { Input } from "@/components/ui/input";

type State = { error?: string } | null;

export function SignUpForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<State, FormData>(
    signUpParent,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="displayName" className="block font-fredoka font-medium text-sm text-purple-900/80">
          {t("displayName")}
        </label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          placeholder="Ana García"
          className="rounded-2xl h-12 border-purple-100 focus-visible:ring-purple-400 bg-purple-50/30"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="familyName" className="block font-fredoka font-medium text-sm text-purple-900/80">
          {t("familyName")}
        </label>
        <Input
          id="familyName"
          name="familyName"
          type="text"
          required
          placeholder="Familia García"
          className="rounded-2xl h-12 border-purple-100 focus-visible:ring-purple-400 bg-purple-50/30"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block font-fredoka font-medium text-sm text-purple-900/80">
          {t("email")}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ana@ejemplo.com"
          className="rounded-2xl h-12 border-purple-100 focus-visible:ring-purple-400 bg-purple-50/30"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block font-fredoka font-medium text-sm text-purple-900/80">
          {t("password")}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="rounded-2xl h-12 border-purple-100 focus-visible:ring-purple-400 bg-purple-50/30"
        />
        <p className="text-xs text-purple-400/80 font-fredoka">Mínimo 8 caracteres</p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 rounded-xl bg-red-50 px-4 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full group transition-transform active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed pt-1"
      >
        <div className="p-0.5 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 shadow-lg shadow-purple-200/60">
          <div className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-6 py-3.5 flex items-center justify-center gap-2">
            <span className="font-fredoka font-bold text-white text-base">
              {pending ? "Creando tu familia… 🏠" : t("signUp")}
            </span>
            {!pending && (
              <span className="text-sm bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            )}
          </div>
        </div>
      </button>
    </form>
  );
}
