"use client";

import { useOptimistic, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveCompletion, rejectCompletion } from "@/server/actions/completions";
import { approveRedemption, rejectRedemption } from "@/server/actions/rewards";

type CompletionRow = {
  id: string;
  completion_date: string;
  status: string;
  tasks: { title: string; emoji: string | null; points: number } | null;
  profiles: { display_name: string; emoji: string | null } | null;
};

type RedemptionRow = {
  id: string;
  requested_at: string;
  status: string;
  cost_points_at_redemption: number;
  rewards: { name: string; emoji: string | null; cost_points: number } | null;
  profiles: { display_name: string; emoji: string | null } | null;
};

type Tab = "tasks" | "rewards";

export function ApprovalsClient({
  completions: initialCompletions,
  redemptions: initialRedemptions,
}: {
  completions: CompletionRow[];
  redemptions: RedemptionRow[];
}) {
  const [tab, setTab] = useState<Tab>("tasks");

  const [completions, removeCompletion] = useOptimistic(
    initialCompletions,
    (state, id: string) => state.filter((c) => c.id !== id),
  );

  const [redemptions, removeRedemption] = useOptimistic(
    initialRedemptions,
    (state, id: string) => state.filter((r) => r.id !== id),
  );

  async function handleApprove(id: string) {
    removeCompletion(id);
    const result = await approveCompletion(id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Aprobado ✅ — puntos sumados");
  }

  async function handleReject(id: string) {
    removeCompletion(id);
    const result = await rejectCompletion(id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast("Rechazado");
  }

  async function handleApproveRedemption(id: string) {
    removeRedemption(id);
    const result = await approveRedemption(id);
    if (result.error) toast.error(result.error);
    else toast.success("Recompensa entregada ✅");
  }

  async function handleRejectRedemption(id: string) {
    removeRedemption(id);
    const result = await rejectRedemption(id);
    if (result.error) toast.error(result.error);
    else toast("Solicitud rechazada — puntos devueltos");
  }

  const tasksCount = completions.length;
  const rewardsCount = redemptions.length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {(["tasks", "rewards"] as Tab[]).map((t) => {
          const isActive = tab === t;
          const count = t === "tasks" ? tasksCount : rewardsCount;
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
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  style={{ zIndex: 0 }}
                />
              )}
              <span className="relative z-10">{t === "tasks" ? "Tareas" : "Recompensas"}</span>
              {count > 0 && (
                <span className="relative z-10 bg-primary text-primary-foreground text-[10px] font-bold rounded-full size-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task completions tab */}
      <AnimatePresence mode="wait">
        {tab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {completions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
              >
                <CheckCircle2 className="size-10 text-success-emerald" />
                <p>No hay tareas pendientes de aprobación. ✅</p>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {completions.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{c.tasks?.emoji ?? "✅"}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{c.tasks?.title ?? "Tarea"}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {c.profiles?.emoji} {c.profiles?.display_name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {c.completion_date}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            +{c.tasks?.points ?? 0} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(c.id)}
                        className="flex-1 rounded-xl h-10 bg-success-emerald/90 hover:bg-success-emerald text-white font-semibold"
                      >
                        <CheckCircle2 className="size-4 mr-1" /> Aprobar
                      </Button>
                      <Button
                        onClick={() => handleReject(c.id)}
                        variant="outline"
                        className="flex-1 rounded-xl h-10 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XCircle className="size-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* Redemptions tab */}
        {tab === "rewards" && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {redemptions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
              >
                <Gift className="size-10 text-primary/50" />
                <p>No hay recompensas pendientes de entrega.</p>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {redemptions.map((r) => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{r.rewards?.emoji ?? "🎁"}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{r.rewards?.name ?? "Recompensa"}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {r.profiles?.emoji} {r.profiles?.display_name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {r.requested_at.slice(0, 10)}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {r.cost_points_at_redemption} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveRedemption(r.id)}
                        className="flex-1 rounded-xl h-10 bg-success-emerald/90 hover:bg-success-emerald text-white font-semibold"
                      >
                        <CheckCircle2 className="size-4 mr-1" /> Entregar
                      </Button>
                      <Button
                        onClick={() => handleRejectRedemption(r.id)}
                        variant="outline"
                        className="flex-1 rounded-xl h-10 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XCircle className="size-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
