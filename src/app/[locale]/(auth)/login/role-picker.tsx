"use client";

import { useState, useRef } from "react";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { LoginForm } from "./login-form";
import { ChevronLeft } from "lucide-react";

type Mode = "pick" | "parent";

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

export function RolePicker() {
  const [mode, setMode] = useState<Mode>("pick");
  const router = useRouter();

  return (
    <LazyMotion features={domAnimation}>
      <main className="child-page relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5 py-10">

        {/* Ambient blobs */}
        <div className="pointer-events-none overflow-hidden absolute inset-0" aria-hidden>
          <div className="animate-blob-a absolute top-[-4rem] left-[-4rem] w-52 h-52 bg-amber-200/40 rounded-full blur-3xl" />
          <div className="animate-blob-b absolute top-[30%] right-[-3rem] w-40 h-40 bg-purple-300/30 rounded-full blur-3xl" />
          <div className="animate-blob-c absolute bottom-[10%] left-[-2rem] w-36 h-36 bg-pink-200/40 rounded-full blur-3xl" />
          <div className="animate-blob-d absolute bottom-[-2rem] right-[10%] w-44 h-44 bg-indigo-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-7">

          {/* ── Logo block ── */}
          <m.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-3 text-center"
          >
            {/* Trophy in double-bezel circle */}
            <m.div variants={itemVariants}>
              <div className="p-1.5 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/70 shadow-lg shadow-amber-100/50">
                <div className="w-20 h-20 rounded-full bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center">
                  <span className="text-5xl select-none">🏆</span>
                </div>
              </div>
            </m.div>

            <m.div variants={itemVariants} className="space-y-1">
              <h1 className="font-fredoka text-3xl font-bold text-amber-900/90 tracking-tight">
                Fichas &amp; Premios
              </h1>
              <p className="font-fredoka text-sm font-medium text-amber-700/70">
                Convierte las tareas en aventuras ✨
              </p>
            </m.div>

            {/* Value props strip */}
            <m.div variants={itemVariants} className="flex items-center gap-2 flex-wrap justify-center">
              {[
                { icon: "⚡", label: "Misiones" },
                { icon: "🏆", label: "Premios" },
                { icon: "📅", label: "Progreso" },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 ring-1 ring-amber-200/60 text-xs font-medium text-amber-800/80 shadow-sm"
                >
                  <span>{icon}</span>
                  {label}
                </span>
              ))}
            </m.div>
          </m.div>

          {/* ── Role cards + parent form toggle ── */}
          <AnimatePresence mode="wait">
            {mode === "pick" && (
              <m.div
                key="pick"
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 22 } }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.18 } }}
                className="w-full space-y-4"
              >
                {/* Role cards grid */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Parent card */}
                  <button
                    onClick={() => setMode("parent")}
                    className="group text-left transition-transform active:scale-[0.97]"
                    aria-label="Entrar como padre o madre"
                  >
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-purple-200/70 shadow-lg shadow-purple-100/40 group-hover:shadow-purple-200/60 transition-shadow">
                      <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 flex flex-col items-center gap-3 min-h-[140px] justify-center">
                        <span className="text-4xl">👨‍👩‍👧</span>
                        <div className="text-center space-y-0.5">
                          <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-purple-400">
                            Padres
                          </p>
                          <p className="font-fredoka font-bold text-base text-purple-900/90 leading-tight">
                            Soy Padre<br />o Madre
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Child card */}
                  <button
                    onClick={() => router.push("/login/child")}
                    className="group text-left transition-transform active:scale-[0.97]"
                    aria-label="Entrar como hijo o hija"
                  >
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/70 shadow-lg shadow-amber-100/40 group-hover:shadow-amber-200/60 transition-shadow">
                      <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 flex flex-col items-center gap-3 min-h-[140px] justify-center">
                        <span className="text-4xl">⭐</span>
                        <div className="text-center space-y-0.5">
                          <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-amber-500">
                            Hijos
                          </p>
                          <p className="font-fredoka font-bold text-base text-amber-900/90 leading-tight">
                            Soy Hijo<br />o Hija
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sign-up CTA */}
                <div className="text-center space-y-3 pt-1">
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-amber-200/50" />
                    <span className="text-[11px] text-amber-700/50 font-medium uppercase tracking-widest">
                      ¿Primera vez aquí?
                    </span>
                    <div className="flex-1 h-px bg-amber-200/50" />
                  </div>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-fredoka font-semibold text-sm shadow-lg shadow-purple-200/50 hover:shadow-purple-300/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Crear cuenta gratis
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">→</span>
                  </Link>
                </div>
              </m.div>
            )}

            {mode === "parent" && (
              <m.div
                key="parent"
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 22 } }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.18 } }}
                className="w-full space-y-4"
              >
                {/* Back to role picker */}
                <button
                  onClick={() => setMode("pick")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600/80 hover:text-purple-700 transition-colors"
                >
                  <ChevronLeft className="size-4" />
                  Cambiar rol
                </button>

                {/* Parent form in double-bezel card */}
                <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-purple-200/70 shadow-xl shadow-purple-100/40">
                  <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-6 py-7 space-y-5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-purple-400">
                        Padres
                      </p>
                      <h2 className="font-fredoka text-xl font-bold text-purple-900/90">
                        Iniciar sesión
                      </h2>
                    </div>
                    <LoginForm />
                  </div>
                </div>

                {/* Sign-up link */}
                <p className="text-center text-sm text-amber-800/60">
                  ¿Sin cuenta?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-purple-600 hover:text-purple-700 underline-offset-4 hover:underline transition-colors"
                  >
                    Regístrate gratis
                  </Link>
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </LazyMotion>
  );
}
