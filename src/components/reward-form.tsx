"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createReward, updateReward } from "@/server/actions/rewards";
import type { Reward } from "@/types";

const EMOJI_OPTIONS = ["🎮", "🍕", "🎬", "📱", "🎲", "🎨", "🚴", "🍦", "🎤", "🏆", "📚", "🛍️", "🎁", "⭐", "🌟", "✨"];
const POINT_CHIPS = [10, 25, 50, 100, 200];

interface RewardFormProps {
  open: boolean;
  onClose: () => void;
  reward?: Reward;
}

export function RewardForm({ open, onClose, reward }: RewardFormProps) {
  const isEditing = !!reward;
  const action = isEditing ? updateReward : createReward;

  const [state, formAction, pending] = useActionState(action, null);
  const [emoji, setEmoji] = useState(reward?.emoji ?? "🎁");
  const [costPoints, setCostPoints] = useState(reward?.cost_points ?? 50);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) {
      toast.success(isEditing ? "Recompensa actualizada" : "Recompensa creada");
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, isEditing, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          <m.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background border-t border-border"
            style={{ maxHeight: "92dvh", overflowY: "auto" }}
          >
            <div className="sticky top-0 bg-background pt-4 px-4 pb-2 flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg">
                {isEditing ? "Editar recompensa" : "Nueva recompensa"}
              </h2>
              <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="px-4 pb-8 space-y-5">
              {isEditing && <input type="hidden" name="id" value={reward.id} />}

              {/* Emoji picker */}
              <div className="space-y-2">
                <Label>Emoji</Label>
                <input type="hidden" name="emoji" value={emoji} />
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`text-2xl p-1 rounded-xl transition-colors ${
                        emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={reward?.name}
                  placeholder="Ej: Hora extra de videojuegos"
                  maxLength={60}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={reward?.description ?? ""}
                  placeholder="Detalles de la recompensa"
                  maxLength={200}
                />
              </div>

              {/* Cost chips */}
              <div className="space-y-2">
                <Label>Coste en puntos</Label>
                <input type="hidden" name="costPoints" value={costPoints} />
                <div className="flex gap-2 flex-wrap">
                  {POINT_CHIPS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCostPoints(p)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                        costPoints === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {p} pts
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  max={9999}
                  value={costPoints}
                  onChange={(e) => setCostPoints(Number(e.target.value))}
                  className="w-28"
                />
              </div>

              <Button type="submit" disabled={pending} className="w-full rounded-xl h-12 font-semibold">
                {pending ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear recompensa"}
              </Button>
            </form>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
