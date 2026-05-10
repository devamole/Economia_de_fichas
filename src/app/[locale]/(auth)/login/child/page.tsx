"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfilesByFamilyCode, signInChild } from "@/server/actions/children";
import { ChevronLeft, Delete } from "lucide-react";

type Profile = { id: string; display_name: string; emoji: string | null; role: string };
type Family = { id: string; name: string; profiles: Profile[] };

type Step = "code" | "pick" | "pin";

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
    setLoading(true);
    setError(null);
    const result = await getProfilesByFamilyCode(familyCode.trim());
    setLoading(false);
    if ("error" in result && result.error) {
      return setError(result.error);
    }
    const data = result as { family: Family };
    const kids = (data.family.profiles as Profile[]).filter(
      (p) => p.role === "child",
    );
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-background">
      <div className="text-center space-y-1">
        <div className="text-5xl">🏆</div>
        <h1 className="font-display text-2xl font-semibold text-primary">
          Fichas &amp; Premios
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {step === "code" && (
          <m.div
            key="code"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-sm space-y-4"
          >
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("familyCode")}</Label>
                <Input
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC123"
                  className="rounded-xl h-14 text-center text-2xl font-bold tracking-[0.4em] uppercase"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading || familyCode.length < 6}
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#7c3aed] to-[#4f46e5]"
              >
                {loading ? "Buscando…" : "Continuar"}
              </Button>
            </form>
          </m.div>
        )}

        {step === "pick" && family && (
          <m.div
            key="pick"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-sm space-y-4"
          >
            <p className="text-center text-muted-foreground text-sm">
              Familia <span className="font-semibold text-foreground">{family.name}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              {family.profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handlePickProfile(profile)}
                  className="flex flex-col items-center gap-3 rounded-3xl border-2 border-border bg-card p-6 hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
                >
                  <span className="text-5xl">{profile.emoji ?? "👤"}</span>
                  <span className="font-semibold text-sm">{profile.display_name}</span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setStep("code")}
              className="w-full"
            >
              <ChevronLeft className="size-4 mr-1" /> Cambiar código
            </Button>
          </m.div>
        )}

        {step === "pin" && selected && (
          <m.div
            key="pin"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-xs space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="text-6xl">{selected.emoji ?? "👤"}</span>
              <p className="font-display font-bold text-xl">{selected.display_name}</p>
              <p className="text-muted-foreground text-sm">{t("pinLabel", { min: 4, max: 6 })}</p>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`size-4 rounded-full border-2 transition-colors ${
                    i < pin.length
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3">
              {["1","2","3","4","5","6","7","8","9","","0","del"].map((k) => (
                <button
                  key={k}
                  onClick={() => k === "del" ? handlePinDelete() : k ? handlePinPress(k) : null}
                  disabled={!k || loading}
                  className={`h-16 rounded-2xl font-bold text-xl transition-all active:scale-90 ${
                    k === "del"
                      ? "text-muted-foreground hover:bg-muted"
                      : k
                      ? "bg-card border border-border hover:bg-muted"
                      : "invisible"
                  }`}
                >
                  {k === "del" ? <Delete className="size-5 mx-auto" /> : k}
                </button>
              ))}
            </div>

            <Button
              onClick={handlePinSubmit}
              disabled={pin.length < 4 || loading}
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#7c3aed] to-[#4f46e5]"
            >
              {loading ? "Entrando…" : "¡Entrar!"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => { setStep("pick"); setError(null); }}
              className="w-full"
            >
              <ChevronLeft className="size-4 mr-1" /> Elegir otro perfil
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
