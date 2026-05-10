"use client";

import { useActionState, useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createChild } from "@/server/actions/children";

const EMOJI_OPTIONS = ["🧒", "👦", "👧", "🧒‍♂️", "🧒‍♀️", "👶", "🐯", "🦊", "🐼", "🦁", "🐸", "🦋", "⭐", "🌟", "🚀", "🎮"];

type Child = { id: string; display_name: string; emoji: string | null; points_balance: number };

export function ChildrenClient({ initialChildren }: { initialChildren: Child[] }) {
  const [children] = useState<Child[]>(initialChildren);
  const [formOpen, setFormOpen] = useState(false);
  const [emoji, setEmoji] = useState("🧒");
  const [state, formAction, pending] = useActionState(createChild, null);

  useEffect(() => {
    if (state && !("error" in state)) {
      toast.success("¡Hijo añadido! Ahora puede acceder con el código de familia.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormOpen(false);
    } else if (state && "error" in state && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} className="gap-2 rounded-xl font-semibold">
          <Plus className="size-4" /> Añadir hijo
        </Button>
      </div>

      {children.length === 0 ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
        >
          <span className="text-5xl">👨‍👩‍👧‍👦</span>
          <p>Aún no hay hijos. ¡Añade el primero!</p>
        </m.div>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <div key={child.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <span className="text-4xl">{child.emoji ?? "🧒"}</span>
              <div className="flex-1">
                <p className="font-semibold">{child.display_name}</p>
                <p className="text-sm text-muted-foreground">{child.points_balance} pts acumulados</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add child sheet */}
      <AnimatePresence>
        {formOpen && (
          <>
            <m.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setFormOpen(false)}
            />
            <m.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background border-t border-border"
              style={{ maxHeight: "90dvh", overflowY: "auto" }}
            >
              <div className="sticky top-0 bg-background pt-4 px-4 pb-2 flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">Añadir hijo</h2>
                <button onClick={() => setFormOpen(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-muted">
                  <X className="size-5" />
                </button>
              </div>

              <form action={formAction} className="px-4 pb-8 space-y-5">
                <div className="space-y-2">
                  <Label>Emoji</Label>
                  <input type="hidden" name="emoji" value={emoji} />
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-2xl p-1 rounded-xl transition-colors ${emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Nombre</Label>
                  <Input id="displayName" name="displayName" placeholder="Ej: María" required maxLength={30} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pin">PIN (4-6 dígitos)</Label>
                  <Input
                    id="pin"
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    minLength={4}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">El niño usará este PIN para acceder.</p>
                </div>

                <Button type="submit" disabled={pending} className="w-full rounded-xl h-12 font-semibold">
                  {pending ? "Creando…" : "Crear cuenta"}
                </Button>
              </form>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
