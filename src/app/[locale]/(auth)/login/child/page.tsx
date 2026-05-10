"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { getProfilesByFamilyCode, signInChild } from "@/server/actions/children";
import { ChevronLeft, Delete } from "lucide-react";

type Profile = { id: string; display_name: string; emoji: string | null; role: string };
type Family = { id: string; name: string; profiles: Profile[] };
type Step = "code" | "pick" | "pin";

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
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
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

// ─── OTP Code Input ───────────────────────────────────────────────────────────
function CodeBoxes({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleInput = (i: number, ch: string) => {
    const char = ch.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1).toUpperCase();
    if (!char) return;
    const arr = value.split("").concat(Array(6).fill("")).slice(0, 6);
    arr[i] = char;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (i < 5) focus(i + 1);
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      const arr = value.split("").concat(Array(6).fill("")).slice(0, 6);
      if (arr[i]) {
        arr[i] = "";
        onChange(arr.join("").slice(0, 6).trimEnd());
      } else if (i > 0) {
        arr[i - 1] = "";
        onChange(arr.join("").slice(0, 6).trimEnd());
        focus(i - 1);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    onChange(text);
    focus(Math.min(text.length, 5));
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => {
        const char = value[i] ?? "";
        const isFilled = !!char;
        const isFocused = false; // CSS :focus handles it
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            maxLength={1}
            value={char}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Carácter ${i + 1} del código familiar`}
            className={[
              "w-11 h-14 rounded-2xl border-2 text-center text-2xl font-bold font-fredoka uppercase",
              "transition-all duration-150 outline-none",
              "bg-white/90",
              isFilled
                ? "border-amber-500 bg-amber-50 text-amber-900"
                : "border-amber-200 text-amber-900 focus:border-amber-400 focus:bg-amber-50",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

// ─── PIN Dots ─────────────────────────────────────────────────────────────────
function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <div className="flex justify-center gap-3" role="status" aria-label={`${filled} de ${length} dígitos ingresados`}>
      {Array.from({ length }).map((_, i) => (
        <m.div
          key={i}
          animate={i < filled
            ? { scale: [1, 1.25, 1], backgroundColor: "#f59e0b" }
            : { scale: 1, backgroundColor: "transparent" }
          }
          transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
          className={[
            "size-5 rounded-full border-2",
            i < filled ? "border-amber-500" : "border-amber-200",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─── PIN Key Button ───────────────────────────────────────────────────────────
function PinKey({
  label,
  onPress,
  isDelete = false,
  disabled = false,
}: {
  label: React.ReactNode;
  onPress: () => void;
  isDelete?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      aria-label={isDelete ? "Borrar último dígito" : String(label)}
      className={[
        "transition-transform active:scale-90 disabled:opacity-40",
        isDelete ? "flex items-center justify-center" : "",
      ].join(" ")}
    >
      {isDelete ? (
        <div className="h-16 w-full flex items-center justify-center text-amber-600">
          <Delete className="size-5" />
        </div>
      ) : (
        <div className="p-0.5 rounded-2xl bg-amber-50/80 ring-1 ring-amber-100">
          <div className="rounded-[calc(2rem-1px)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] h-16 w-full flex items-center justify-center font-fredoka font-bold text-2xl text-amber-900">
            {label}
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChildLoginPage() {
  const t = useTranslations("auth");
  const { push } = useRouter();

  const [step, setStep] = useState<Step>("code");
  const [familyCode, setFamilyCode] = useState("");
  const [family, setFamily] = useState<Family | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (familyCode.length < 6) return;
    setLoading(true);
    setError(null);
    const result = await getProfilesByFamilyCode(familyCode.trim());
    setLoading(false);
    if ("error" in result && result.error) return setError(result.error);
    const data = result as { family: Family };
    const kids = (data.family.profiles as Profile[]).filter((p) => p.role === "child");
    setFamily({ ...data.family, profiles: kids });
    setStep("pick");
  }

  function handlePickProfile(profile: Profile) {
    setSelected(profile);
    setPin("");
    setError(null);
    setStep("pin");
  }

  function handlePinPress(digit: string) {
    if (pin.length < 6) setPin((p) => p + digit);
  }

  function handlePinDelete() {
    setPin((p) => p.slice(0, -1));
  }

  async function handlePinSubmit() {
    if (!selected || pin.length < 4) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("familyCode", familyCode);
    fd.set("profileId", selected.id);
    fd.set("pin", pin);
    const result = await signInChild(null, fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      setPin("");
      return;
    }
    push("/child/today");
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="child-page relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-5 py-10">

        {/* Ambient blobs */}
        <div className="pointer-events-none overflow-hidden absolute inset-0" aria-hidden>
          <div className="animate-blob-a absolute top-[-4rem] left-[-4rem] w-52 h-52 bg-amber-200/40 rounded-full blur-3xl" />
          <div className="animate-blob-b absolute top-[35%] right-[-3rem] w-40 h-40 bg-orange-300/25 rounded-full blur-3xl" />
          <div className="animate-blob-c absolute bottom-[10%] left-[-2rem] w-36 h-36 bg-yellow-200/35 rounded-full blur-3xl" />
          <div className="animate-blob-d absolute bottom-[-2rem] right-[10%] w-44 h-44 bg-amber-100/50 rounded-full blur-3xl" />
        </div>

        {/* Back to role picker */}
        <div className="relative z-10 w-full max-w-sm mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-700/60 hover:text-amber-800 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Cambiar rol
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Code ── */}
            {step === "code" && (
              <m.div
                key="code"
                initial={{ opacity: 0, x: 40, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 24 } }}
                exit={{ opacity: 0, x: -40, filter: "blur(4px)", transition: { duration: 0.18 } }}
              >
                <m.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Header */}
                  <m.div variants={itemVariants} className="text-center space-y-1.5">
                    <h1 className="font-fredoka text-2xl font-bold text-amber-900/90">
                      ¿En qué familia estás?
                    </h1>
                    <p className="font-fredoka text-sm font-medium text-amber-700/65">
                      Pide el código de 6 letras a tus padres 🔑
                    </p>
                  </m.div>

                  {/* Code card */}
                  <m.div variants={itemVariants}>
                    <form onSubmit={handleCodeSubmit}>
                      <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/70 shadow-xl shadow-amber-100/40">
                        <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-6 py-7 space-y-6">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-amber-500 text-center">
                              Código familiar
                            </p>
                            <CodeBoxes value={familyCode} onChange={setFamilyCode} />
                          </div>

                          {error && (
                            <m.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 text-center"
                            >
                              {error}
                            </m.p>
                          )}

                          {/* Submit button (double-bezel pill) */}
                          <button
                            type="submit"
                            disabled={loading || familyCode.length < 6}
                            className="w-full group transition-transform active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="p-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg shadow-amber-200/60">
                              <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 flex items-center justify-center gap-2">
                                <span className="font-fredoka font-bold text-white text-base">
                                  {loading ? "Buscando…" : "Continuar"}
                                </span>
                                {!loading && (
                                  <span className="text-sm bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                                    →
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </form>
                  </m.div>
                </m.div>
              </m.div>
            )}

            {/* ── Step 2: Pick Profile ── */}
            {step === "pick" && family && (
              <m.div
                key="pick"
                initial={{ opacity: 0, x: 40, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 24 } }}
                exit={{ opacity: 0, x: -40, filter: "blur(4px)", transition: { duration: 0.18 } }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <h1 className="font-fredoka text-2xl font-bold text-amber-900/90">
                    ¡Encontramos tu familia!
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 ring-1 ring-amber-200/60">
                    <span className="text-sm">🏠</span>
                    <span className="font-fredoka font-semibold text-amber-800 text-sm">
                      {family.name}
                    </span>
                  </div>
                  <p className="font-fredoka text-sm font-medium text-amber-700/65">
                    ¿Eres tú? 👇
                  </p>
                </div>

                {/* Profile grid */}
                <m.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3"
                >
                  {family.profiles.map((profile) => (
                    <m.div key={profile.id} variants={cardVariants}>
                      <button
                        onClick={() => handlePickProfile(profile)}
                        className="w-full group transition-transform active:scale-[0.95]"
                        aria-label={`Seleccionar perfil de ${profile.display_name}`}
                      >
                        <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/70 shadow-lg shadow-amber-100/40 group-hover:shadow-amber-200/60 transition-shadow">
                          <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 flex flex-col items-center gap-3">
                            <span className="text-5xl select-none">{profile.emoji ?? "👤"}</span>
                            <span className="font-fredoka font-bold text-sm text-amber-900/90 text-center leading-tight">
                              {profile.display_name}
                            </span>
                          </div>
                        </div>
                      </button>
                    </m.div>
                  ))}
                </m.div>

                {/* Back button */}
                <button
                  onClick={() => setStep("code")}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm font-medium text-amber-700/60 hover:text-amber-800 transition-colors py-2"
                >
                  <ChevronLeft className="size-4" />
                  Cambiar código
                </button>
              </m.div>
            )}

            {/* ── Step 3: PIN ── */}
            {step === "pin" && selected && (
              <m.div
                key="pin"
                initial={{ opacity: 0, x: 40, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 24 } }}
                exit={{ opacity: 0, x: -40, filter: "blur(4px)", transition: { duration: 0.18 } }}
                className="space-y-6"
              >
                {/* Avatar in double-bezel circle */}
                <div className="flex flex-col items-center gap-4">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/70 shadow-xl shadow-amber-100/40">
                    <div className="w-24 h-24 rounded-full bg-white/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center">
                      <span className="text-5xl select-none">{selected.emoji ?? "👤"}</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <h1 className="font-fredoka text-2xl font-bold text-amber-900/90">
                      ¡Hola, {selected.display_name}! 👋
                    </h1>
                    <p className="font-fredoka text-sm font-medium text-amber-700/65">
                      Escribe tu PIN secreto 🔒
                    </p>
                  </div>
                </div>

                {/* PIN dots */}
                <PinDots length={6} filled={pin.length} />

                {error && (
                  <m.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2"
                  >
                    {error}
                  </m.p>
                )}

                {/* Number pad */}
                <div className="grid grid-cols-3 gap-2.5">
                  {(["1","2","3","4","5","6","7","8","9","","0","del"] as const).map((k, idx) => {
                    if (k === "") {
                      return <div key={idx} aria-hidden />;
                    }
                    if (k === "del") {
                      return (
                        <PinKey
                          key="del"
                          label={<Delete className="size-5" />}
                          onPress={handlePinDelete}
                          isDelete
                          disabled={loading}
                        />
                      );
                    }
                    return (
                      <PinKey
                        key={k}
                        label={k}
                        onPress={() => handlePinPress(k)}
                        disabled={loading}
                      />
                    );
                  })}
                </div>

                {/* Enter button */}
                <button
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4 || loading}
                  className="w-full group transition-transform active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg shadow-amber-200/60">
                    <div className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 flex items-center justify-center gap-2">
                      <span className="font-fredoka font-bold text-white text-base">
                        {loading ? "Entrando…" : "¡Entrar! 🚀"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Back button */}
                <button
                  onClick={() => { setStep("pick"); setError(null); }}
                  className="w-full inline-flex items-center justify-center gap-1 text-sm font-medium text-amber-700/60 hover:text-amber-800 transition-colors py-2"
                >
                  <ChevronLeft className="size-4" />
                  Elegir otro perfil
                </button>
              </m.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </LazyMotion>
  );
}
