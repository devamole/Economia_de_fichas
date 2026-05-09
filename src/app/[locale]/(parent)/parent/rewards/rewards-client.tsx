"use client";

import { useState, useOptimistic } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RewardForm } from "@/components/reward-form";
import { MoneyExchangeSettings, type MoneyExchangeConfig } from "@/components/money-exchange-settings";
import { toggleRewardActive, deleteReward } from "@/server/actions/rewards";
import type { Reward } from "@/types";

type Tab = "rewards" | "money";

type OptimisticAction =
  | { type: "toggle"; id: string; active: boolean }
  | { type: "delete"; id: string };

export function RewardsClient({
  rewards: initial,
  moneyExchangeConfig,
}: {
  rewards: Reward[];
  moneyExchangeConfig: MoneyExchangeConfig;
}) {
  const [tab, setTab] = useState<Tab>("rewards");
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
      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {(["rewards", "money"] as Tab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="rewards-tab-bg"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  style={{ zIndex: 0 }}
                />
              )}
              <span className="relative z-10">
                {t === "rewards" ? "Recompensas" : "💰 Dinero"}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "rewards" && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
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
          </motion.div>
        )}

        {tab === "money" && (
          <motion.div
            key="money"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-4">
                <p className="font-semibold">Canje por Dinero</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Los niños podrán canjear sus puntos por dinero real según la tasa que configures.
                  La opción no aparecerá hasta que la habilites.
                </p>
              </div>
              <MoneyExchangeSettings initialConfig={moneyExchangeConfig} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RewardForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        reward={editingReward}
      />
    </>
  );
}
