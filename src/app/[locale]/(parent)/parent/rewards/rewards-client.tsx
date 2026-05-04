"use client";

import { useState, useOptimistic } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RewardForm } from "@/components/reward-form";
import { toggleRewardActive, deleteReward } from "@/server/actions/rewards";
import type { Reward } from "@/types";

type OptimisticAction =
  | { type: "toggle"; id: string; active: boolean }
  | { type: "delete"; id: string };

export function RewardsClient({ rewards: initial }: { rewards: Reward[] }) {
  const [rewards, dispatchOptimistic] = useOptimistic(
    initial,
    (state: Reward[], action: OptimisticAction) => {
      if (action.type === "toggle") {
        return state.map((r) => r.id === action.id ? { ...r, active: action.active } : r);
      }
      if (action.type === "delete") {
        return state.filter((r) => r.id !== action.id);
      }
      return state;
    },
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | undefined>();

  function openNew() {
    setEditingReward(undefined);
    setFormOpen(true);
  }

  function openEdit(reward: Reward) {
    setEditingReward(reward);
    setFormOpen(true);
  }

  async function handleToggle(reward: Reward) {
    dispatchOptimistic({ type: "toggle", id: reward.id, active: !reward.active });
    const result = await toggleRewardActive(reward.id, !reward.active);
    if (result.error) toast.error(result.error);
  }

  async function handleDelete(id: string) {
    dispatchOptimistic({ type: "delete", id });
    const result = await deleteReward(id);
    if (result.error) toast.error(result.error);
    else toast("Recompensa eliminada");
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2 rounded-xl font-semibold">
          <Plus className="size-4" /> Nueva
        </Button>
      </div>

      {rewards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
        >
          <span className="text-5xl">🎁</span>
          <p>Aún no hay recompensas. ¡Crea la primera!</p>
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
              className={`rounded-2xl border border-border bg-card p-4 space-y-3 transition-opacity ${
                reward.active ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{reward.emoji ?? "🎁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{reward.name}</p>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground truncate">{reward.description}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-0.5">{reward.cost_points} pts</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(reward)}
                  className="gap-1.5 text-xs"
                >
                  {reward.active
                    ? <><ToggleRight className="size-4 text-primary" /> Activa</>
                    : <><ToggleLeft className="size-4" /> Inactiva</>
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(reward)}
                  className="gap-1.5 text-xs"
                >
                  <Pencil className="size-4" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(reward.id)}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Eliminar
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <RewardForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        reward={editingReward}
      />
    </>
  );
}
