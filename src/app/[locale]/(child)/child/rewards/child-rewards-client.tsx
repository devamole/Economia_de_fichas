"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { redeemReward } from "@/server/actions/rewards";
import { useCelebrate } from "@/components/celebrate";
import type { Reward } from "@/types";

type RedemptionRow = {
  id: string;
  requested_at: string;
  status: string;
  cost_points_at_redemption: number;
  rewards: { name: string; emoji: string | null } | null;
};

interface ChildRewardsClientProps {
  rewards: Reward[];
  redemptions: RedemptionRow[];
  pointsBalance: number;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="size-3.5 text-yellow-500" />,
  fulfilled: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  rejected: <XCircle className="size-3.5 text-destructive" />,
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  fulfilled: "Entregada",
  rejected: "Rechazada",
};

export function ChildRewardsClient({ rewards, redemptions, pointsBalance }: ChildRewardsClientProps) {
  const [balance, setBalance] = useState(pointsBalance);
  const [confirming, setConfirming] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(false);
  const celebrate = useCelebrate();

  async function handleRedeem(reward: Reward) {
    setLoading(true);

    const result = await redeemReward(reward.id);
    setLoading(false);
    setConfirming(null);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      setBalance((b) => b - reward.cost_points);
      celebrate();
      toast.success(`¡${reward.name} canjeada! 🎉`);
    }
  }

  const canAfford = (cost: number) => balance >= cost;

  return (
    <div className="space-y-6">
      {/* Reward catalog */}
      <section className="space-y-3">
        {rewards.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <span className="text-5xl">🎁</span>
            <p>Aún no hay recompensas disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const affordable = canAfford(reward.cost_points);
              return (
                <motion.button
                  key={reward.id}
                  whileTap={affordable ? { scale: 0.96 } : {}}
                  onClick={() => affordable && setConfirming(reward)}
                  className={`relative rounded-2xl border border-border bg-card p-4 text-left transition-opacity ${
                    affordable ? "hover:border-primary/50" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="text-4xl block mb-2">{reward.emoji ?? "🎁"}</span>
                  <p className="font-semibold text-sm leading-tight">{reward.name}</p>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reward.description}</p>
                  )}
                  <p className={`text-sm font-bold mt-2 ${affordable ? "text-primary" : "text-muted-foreground"}`}>
                    {reward.cost_points} pts
                  </p>
                  {!affordable && (
                    <div className="absolute top-2 right-2 text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                      Bloqueada
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {/* Redemption history */}
      {redemptions.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Historial</h2>
          <div className="space-y-2">
            {redemptions.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <span className="text-2xl">{r.rewards?.emoji ?? "🎁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.rewards?.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {STATUS_ICON[r.status]}
                    <span className="text-xs text-muted-foreground">{STATUS_LABEL[r.status] ?? r.status}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">
                  -{r.cost_points_at_redemption} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirming && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setConfirming(null)}
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl bg-background border border-border p-6 space-y-4 text-center"
            >
              <span className="text-6xl block">{confirming.emoji ?? "🎁"}</span>
              <h2 className="font-display font-bold text-xl">{confirming.name}</h2>
              {confirming.description && (
                <p className="text-sm text-muted-foreground">{confirming.description}</p>
              )}
              <p className="text-3xl font-bold text-primary">{confirming.cost_points} pts</p>
              <p className="text-sm text-muted-foreground">
                Te quedarán <strong>{balance - confirming.cost_points} pts</strong>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setConfirming(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl font-semibold"
                  disabled={loading}
                  onClick={() => handleRedeem(confirming)}
                >
                  {loading ? "Canjeando…" : "Canjear 🎉"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
