import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SignUpForm } from "./sign-up-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signUp") };
}

export default async function SignUpPage() {
  return (
    <main className="child-page relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5 py-10">

      {/* Ambient blobs */}
      <div className="pointer-events-none overflow-hidden absolute inset-0" aria-hidden>
        <div className="animate-blob-a absolute top-[-4rem] right-[-2rem] w-52 h-52 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="animate-blob-b absolute top-[30%] left-[-3rem] w-40 h-40 bg-indigo-300/25 rounded-full blur-3xl" />
        <div className="animate-blob-c absolute bottom-[15%] right-[-2rem] w-36 h-36 bg-violet-200/35 rounded-full blur-3xl" />
        <div className="animate-blob-d absolute bottom-[-2rem] left-[10%] w-44 h-44 bg-amber-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-7">

        {/* ── Hero header ── */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Trophy in double-bezel circle */}
          <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-purple-200/70 shadow-lg shadow-purple-100/50">
            <div className="w-20 h-20 rounded-full bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <span className="text-5xl select-none">🏆</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="font-fredoka text-3xl font-bold text-purple-900/90 tracking-tight">
              Crea tu familia
            </h1>
            <p className="font-fredoka text-sm font-medium text-purple-700/65">
              Empieza gratis en 2 minutos ✨
            </p>
          </div>

          {/* Value props */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {[
              "✓ Sin tarjeta",
              "✓ Para toda la familia",
              "✓ Gratis para siempre",
            ].map((prop) => (
              <span
                key={prop}
                className="inline-flex items-center px-3 py-1 rounded-full bg-white/80 ring-1 ring-purple-200/60 text-xs font-medium text-purple-800/80 shadow-sm"
              >
                {prop}
              </span>
            ))}
          </div>
        </div>

        {/* ── Form in double-bezel card ── */}
        <div className="w-full p-1.5 rounded-[2rem] bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-purple-200/70 shadow-xl shadow-purple-100/40">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-6 py-7 space-y-5">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-purple-400">
                Nueva cuenta
              </p>
              <h2 className="font-fredoka text-xl font-bold text-purple-900/90">
                Registrarse
              </h2>
            </div>
            <SignUpForm />
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-sm text-amber-800/60">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-purple-600 hover:text-purple-700 underline-offset-4 hover:underline transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
