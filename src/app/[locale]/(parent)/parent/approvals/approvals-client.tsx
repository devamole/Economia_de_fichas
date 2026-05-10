"use client";

import { useOptimistic, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  money_value_at_redemption: number | null;
  rewards: { name: string; emoji: string | null; cost_points: number; type: string } | null;
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
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

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
    else toast.success("Aprobado ✅");
  }

  async function handleReject(id: string) {
    setRejectingId(id);
    setRejectNote("");
  }

  async function confirmReject() {
    if (!rejectingId) return;
    const id = rejectingId;
    const result = await rejectCompletion(id, rejectNote || undefined);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    removeCompletion(id);
    setRejectingId(null);
    toast("Rechazado — puntos descontados");
    setRejectNote("");
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
                <m.div
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
          <m.div
            key="tasks"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {completions.length === 0 ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
              >
                <CheckCircle2 className="size-10 text-success-emerald" />
                <p>No hay tareas pendientes de aprobación. ✅</p>
              </m.div>
            ) : (
              <AnimatePresence initial={false}>
                {completions.map((c) => (
                  <m.div
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
                  </m.div>
                ))}
              </AnimatePresence>
            )}
          </m.div>
        )}

        {/* Redemptions tab */}
        {tab === "rewards" && (
          <m.div
            key="rewards"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {redemptions.length === 0 ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
              >
                <Gift className="size-10 text-primary/50" />
                <p>No hay recompensas pendientes de entrega.</p>
              </m.div>
            ) : (
              <AnimatePresence initial={false}>
                {redemptions.map((r) => {
                  const isMoney = r.rewards?.type === "money_exchange";
                  return (
                    <m.div
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
                      className="rounded-2xl border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{isMoney ? "💰" : (r.rewards?.emoji ?? "🎁")}</span>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {isMoney ? "Canje por Dinero" : (r.rewards?.name ?? "Recompensa")}
                          </p>
                          {isMoney && r.money_value_at_redemption != null && (
                            <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                              💵 {r.money_value_at_redemption.toFixed(2)} a entregar
                            </p>
                          )}
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
                    </m.div>
                  );
                })}
              </AnimatePresence>
            )}
          </m.div>
        )}
      </AnimatePresence>

      <Dialog
        open={rejectingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            setRejectNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar tarea</DialogTitle>
            <DialogDescription>
              Esta acción marcará la tarea como rechazada y revertirá los puntos otorgados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="reject-note" className="text-sm font-medium">
              Nota opcional
            </label>
            <Input
              id="reject-note"
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              placeholder="Explica brevemente por qué la rechazas"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectingId(null);
                setRejectNote("");
              }}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmReject}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
