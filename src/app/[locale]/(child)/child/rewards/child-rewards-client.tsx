"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redeemReward, redeemMoneyExchange } from "@/server/actions/rewards";
import { useCelebrate } from "@/components/celebrate";
import type { Reward } from "@/types";

type RedemptionRow = {
  id: string;
  requested_at: string;
  status: string;
  cost_points_at_redemption: number;
  money_value_at_redemption: number | null;
  rewards: { name: string; emoji: string | null; type: string } | null;
};

interface MoneyExchangeConfig {
  rate: number;
  currency: string;
  enabled: true;
}

interface ChildRewardsClientProps {
  rewards: Reward[];
  redemptions: RedemptionRow[];
  pointsBalance: number;
  moneyExchangeConfig: MoneyExchangeConfig | null;
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

export function ChildRewardsClient({ rewards, redemptions, pointsBalance, moneyExchangeConfig }: ChildRewardsClientProps) {
  const [balance, setBalance] = useState(pointsBalance);
  const [confirming, setConfirming] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(false);
  const celebrate = useCelebrate();

  // Money exchange state
  const [confirmingMoney, setConfirmingMoney] = useState(false);
  const [moneyPoints, setMoneyPoints] = useState("");
  const [loadingMoney, setLoadingMoney] = useState(false);

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

  async function handleRedeemMoney() {
    const pts = parseInt(moneyPoints, 10);
    if (isNaN(pts) || pts < 1) return;
    setLoadingMoney(true);
    const result = await redeemMoneyExchange(pts);
    setLoadingMoney(false);
    setConfirmingMoney(false);
    setMoneyPoints("");
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setBalance((b) => b - pts);
      celebrate();
      const moneyStr = `${result.money_value.toFixed(2)} ${result.currency}`;
      toast.success(`¡Canje solicitado! 💰 ${pts} pts → ${moneyStr}`);
    }
  }

  const canAfford = (cost: number) => balance >= cost;

  const moneyPtsNum = parseInt(moneyPoints, 10);
  const moneyPreview =
    moneyExchangeConfig && !isNaN(moneyPtsNum) && moneyPtsNum > 0
      ? (moneyPtsNum * moneyExchangeConfig.rate).toFixed(2)
      : null;

  return (
    <div className="space-y-6">
      {/* Money exchange card */}
      {moneyExchangeConfig && (
        <m.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { setConfirmingMoney(true); setMoneyPoints(""); }}
          className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left hover:border-primary/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">💰</span>
            <div className="flex-1">
              <p className="font-semibold">Canjear por Dinero</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                1 pt = {moneyExchangeConfig.rate.toFixed(2)} {moneyExchangeConfig.currency}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-1">
              Tus pts
            </span>
          </div>
        </m.button>
      )}

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
                <m.button
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
                </m.button>
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
            {redemptions.map((r) => {
              const isMoney = r.rewards?.type === "money_exchange";
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <span className="text-2xl">{isMoney ? "💰" : (r.rewards?.emoji ?? "🎁")}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isMoney ? "Canje por Dinero" : r.rewards?.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {STATUS_ICON[r.status]}
                      <span className="text-xs text-muted-foreground">{STATUS_LABEL[r.status] ?? r.status}</span>
                      {isMoney && r.money_value_at_redemption != null && (
                        <span className="text-xs font-semibold text-emerald-600 ml-1">
                          → {r.money_value_at_redemption.toFixed(2)} {moneyExchangeConfig?.currency ?? ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">
                    -{r.cost_points_at_redemption} pts
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Money exchange modal */}
      <AnimatePresence>
        {confirmingMoney && moneyExchangeConfig && (
          <>
            <m.div
              key="money-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setConfirmingMoney(false)}
            />
            <m.div
              key="money-dialog"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl bg-background border border-border p-6 space-y-4 text-center"
            >
              <span className="text-6xl block">💰</span>
              <h2 className="font-display font-semibold text-xl">Canjear por Dinero</h2>
              <p className="text-sm text-muted-foreground">
                1 pt = {moneyExchangeConfig.rate.toFixed(2)} {moneyExchangeConfig.currency}
              </p>

              <div className="space-y-2 text-left">
                <label htmlFor="money-points" className="text-sm font-medium">¿Cuántos puntos quieres canjear?</label>
                <Input
                  id="money-points"
                  type="number"
                  min={1}
                  max={balance}
                  value={moneyPoints}
                  onChange={(e) => setMoneyPoints(e.target.value)}
                  placeholder="Ej: 50"
                  className="text-center text-lg h-12"
                  autoFocus
                />
              </div>

              {moneyPreview && (
                <div className="rounded-xl bg-primary/10 p-3 space-y-1">
                  <p className="text-2xl font-bold text-primary">
                    {moneyPreview} {moneyExchangeConfig.currency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Te quedarán <strong>{balance - moneyPtsNum} pts</strong>
                  </p>
                </div>
              )}

              {moneyPtsNum > balance && (
                <p className="text-sm text-destructive">No tienes suficientes puntos.</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setConfirmingMoney(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl font-semibold"
                  disabled={
                    loadingMoney ||
                    !moneyPreview ||
                    isNaN(moneyPtsNum) ||
                    moneyPtsNum < 1 ||
                    moneyPtsNum > balance
                  }
                  onClick={handleRedeemMoney}
                >
                  {loadingMoney ? "Canjeando…" : "Canjear 💰"}
                </Button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirming && (
          <>
            <m.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setConfirming(null)}
            />
            <m.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl bg-background border border-border p-6 space-y-4 text-center"
            >
              <span className="text-6xl block">{confirming.emoji ?? "🎁"}</span>
              <h2 className="font-display font-semibold text-xl">{confirming.name}</h2>
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
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
