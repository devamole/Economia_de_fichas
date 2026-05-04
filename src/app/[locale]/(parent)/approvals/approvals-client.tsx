"use client";

import { useOptimistic, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveCompletion, rejectCompletion } from "@/server/actions/completions";

type CompletionRow = {
  id: string;
  completion_date: string;
  status: string;
  tasks: { title: string; emoji: string | null; points: number } | null;
  profiles: { display_name: string; emoji: string | null } | null;
};

export function ApprovalsClient({ completions: initial }: { completions: CompletionRow[] }) {
  const [completions, removeOptimistic] = useOptimistic(
    initial,
    (state, id: string) => state.filter((c) => c.id !== id),
  );

  async function handleApprove(id: string) {
    removeOptimistic(id);
    const result = await approveCompletion(id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast.success("Aprobado ✅ — puntos sumados");
  }

  async function handleReject(id: string) {
    removeOptimistic(id);
    const result = await rejectCompletion(id);
    if ("error" in result && result.error) toast.error(result.error);
    else toast("Rechazado");
  }

  return (
    <div className="space-y-3">
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
    </div>
  );
}
