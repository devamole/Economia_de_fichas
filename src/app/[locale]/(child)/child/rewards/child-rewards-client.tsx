"use client";

import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { redeemReward, redeemMoneyExchange } from "@/server/actions/rewards";
import { useCelebrate } from "@/components/celebrate";
import { PointsCounter } from "@/components/points-counter";
import type { Reward } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  pendingPoints: number;
  moneyExchangeConfig: MoneyExchangeConfig | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_COLORS = [
  { accent: "#F59E0B", bg: "#FFF9E6" },
  { accent: "#EC4899", bg: "#FDF2F8" },
  { accent: "#0EA5E9", bg: "#E0F2FE" },
  { accent: "#A855F7", bg: "#F3E8FF" },
  { accent: "#10B981", bg: "#ECFDF5" },
  { accent: "#F97316", bg: "#FFF0E8" },
] as const;

const STATUS_CONFIG = {
  pending:   { label: "Pendiente", accent: "#F59E0B", bg: "#FFF9E6", emoji: "⏳" },
  fulfilled: { label: "Entregada", accent: "#10B981", bg: "#ECFDF5", emoji: "✅" },
  rejected:  { label: "Rechazada", accent: "#EF4444", bg: "#FEF2F2", emoji: "❌" },
} as const;

// ── Framer-Motion variants ─────────────────────────────────────────────────────

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden:   { opacity: 0, y: 24, filter: "blur(4px)" },
  visible:  {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function darkenHex(hex: string, amount = 0.15): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = (c: number) => Math.max(0, Math.floor(c * (1 - amount)));
  return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
}

function triggerAnimeRipple(el: HTMLDivElement) {
  import("animejs").then(({ animate }) => {
    animate(el, {
      scale: [1, 4],
      opacity: [0.5, 0],
      duration: 540,
      ease: "outExpo",
      onComplete() {
        el.style.transform = "scale(1)";
        el.style.opacity = "0";
      },
    });
  });
}

// ── Main client component ─────────────────────────────────────────────────────

export function ChildRewardsClient({
  rewards,
  redemptions,
  pointsBalance,
  pendingPoints,
  moneyExchangeConfig,
}: ChildRewardsClientProps) {
  const [balance, setBalance]           = useState(pointsBalance);
  const [confirming, setConfirming]     = useState<{ reward: Reward; idx: number } | null>(null);
  const [loading, setLoading]           = useState(false);
  const celebrate                       = useCelebrate();

  const [confirmingMoney, setConfirmingMoney] = useState(false);
  const [moneyPoints, setMoneyPoints]         = useState("");
  const [loadingMoney, setLoadingMoney]       = useState(false);

  const availableBalance = Math.max(0, balance - pendingPoints);
  const canAfford = (cost: number) => availableBalance >= cost;

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
      toast.success(`¡Canje solicitado! 💰 ${pts} pts → ${result.money_value.toFixed(2)} ${result.currency}`);
    }
  }

  const moneyPtsNum = parseInt(moneyPoints, 10);
  const moneyPreview =
    moneyExchangeConfig && !isNaN(moneyPtsNum) && moneyPtsNum > 0
      ? (moneyPtsNum * moneyExchangeConfig.rate).toFixed(2)
      : null;

  const confirmingColors = confirming
    ? CARD_COLORS[confirming.idx % CARD_COLORS.length]
    : CARD_COLORS[0];

  return (
    <main className="child-page flex flex-col flex-1 gap-0 pb-4 overflow-hidden">

      {/* ── Background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-blob-a absolute -top-20 -left-20 size-64 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="animate-blob-b absolute top-32 -right-16 size-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="animate-blob-c absolute bottom-60 -left-10 size-48 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="animate-blob-d absolute -bottom-10 right-10 size-52 rounded-full bg-pink-300/20 blur-3xl" />
      </div>

      {/* ── Hero header ── */}
      <div className="relative z-10 px-5 pt-8 pb-4">
        <p className="font-fredoka text-base font-medium text-amber-700/80">
          Mis Recompensas ✨
        </p>
        <div className="mt-1">
          <PointsCounter points={balance} />
        </div>

        {pendingPoints > 0 && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 26 }}
            className="mt-3 flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
            style={{
              background: "linear-gradient(135deg, #FFF9E6, #FEF3C7)",
              border: "1px solid rgba(245,158,11,0.3)",
              boxShadow: "0 2px 14px -2px rgba(245,158,11,0.28)",
            }}
          >
            <span className="text-xl animate-flame leading-none shrink-0">⏳</span>
            <div>
              <p className="font-fredoka text-sm font-semibold text-amber-700">
                +{pendingPoints} pts en camino
              </p>
              <p className="font-fredoka text-xs text-amber-600/80">
                ¡Cuando aprueben tus tareas ya son tuyos!
              </p>
            </div>
          </m.div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="relative z-10 flex-1 px-4 space-y-6 pb-2">

        {/* Money exchange card */}
        {moneyExchangeConfig && (
          <m.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.08 }}
          >
            <MoneyExchangeCard
              config={moneyExchangeConfig}
              availableBalance={availableBalance}
              onOpen={() => { setConfirmingMoney(true); setMoneyPoints(""); }}
            />
          </m.div>
        )}

        {/* Reward catalog */}
        {rewards.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-4"
          >
            <span className="text-7xl">🎁</span>
            <p className="font-fredoka text-xl font-semibold text-amber-700/70">
              Aún no hay recompensas
            </p>
            <p className="font-fredoka text-sm text-amber-600/60">
              ¡Pídele a papá o mamá que agreguen algunas!
            </p>
          </m.div>
        ) : (
          <section className="space-y-3">
            {/* Section pill header */}
            <m.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                <span
                  className="flex items-center justify-center size-5 rounded-full text-xs leading-none"
                  style={{ background: "rgba(245,158,11,0.2)" }}
                >
                  🎁
                </span>
                <span
                  className="font-fredoka text-xs font-bold uppercase tracking-[0.12em]"
                  style={{ color: "#F59E0B" }}
                >
                  Catálogo
                </span>
              </div>
              <div
                className="flex-1 h-px rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.35), transparent)" }}
              />
            </m.div>

            {/* Staggered 2-column grid */}
            <m.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              {rewards.map((reward, i) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  colors={CARD_COLORS[i % CARD_COLORS.length]}
                  affordable={canAfford(reward.cost_points)}
                  onClaim={() => setConfirming({ reward, idx: i })}
                />
              ))}
            </m.div>
          </section>
        )}

        {/* Redemption history */}
        {redemptions.length > 0 && (
          <section className="space-y-3">
            <m.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.12 }}
            >
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))",
                  border: "1px solid rgba(168,85,247,0.3)",
                }}
              >
                <span
                  className="flex items-center justify-center size-5 rounded-full text-xs leading-none"
                  style={{ background: "rgba(168,85,247,0.2)" }}
                >
                  📜
                </span>
                <span
                  className="font-fredoka text-xs font-bold uppercase tracking-[0.12em]"
                  style={{ color: "#A855F7" }}
                >
                  Historial
                </span>
              </div>
              <div
                className="flex-1 h-px rounded-full"
                style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.35), transparent)" }}
              />
            </m.div>

            <m.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2.5"
            >
              {redemptions.map((r) => (
                <HistoryItem
                  key={r.id}
                  redemption={r}
                  currency={moneyExchangeConfig?.currency}
                />
              ))}
            </m.div>
          </section>
        )}
      </div>

      {/* ── Confirm bottom sheet ── */}
      <AnimatePresence>
        {confirming && (
          <ConfirmSheet
            reward={confirming.reward}
            colors={confirmingColors}
            availableBalance={availableBalance}
            loading={loading}
            onConfirm={() => handleRedeem(confirming.reward)}
            onCancel={() => setConfirming(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Money exchange sheet ── */}
      <AnimatePresence>
        {confirmingMoney && moneyExchangeConfig && (
          <MoneyExchangeSheet
            config={moneyExchangeConfig}
            availableBalance={availableBalance}
            moneyPoints={moneyPoints}
            moneyPreview={moneyPreview}
            moneyPtsNum={moneyPtsNum}
            loading={loadingMoney}
            onPointsChange={setMoneyPoints}
            onConfirm={handleRedeemMoney}
            onCancel={() => setConfirmingMoney(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ── Reward Card (Doppelrand) ──────────────────────────────────────────────────

function RewardCard({
  reward,
  colors,
  affordable,
  onClaim,
}: {
  reward: Reward;
  colors: { accent: string; bg: string };
  affordable: boolean;
  onClaim: () => void;
}) {
  const rippleRef = useRef<HTMLDivElement>(null);
  const { accent, bg } = affordable
    ? colors
    : { accent: "#94a3b8", bg: "#f8fafc" };

  function handleClaim() {
    if (rippleRef.current) triggerAnimeRipple(rippleRef.current);
    onClaim();
  }

  return (
    <m.div variants={cardVariants} className="relative">
      {/* Outer shell */}
      <div
        className="rounded-[2rem]"
        style={{
          background: bg,
          border: `1px solid ${accent}33`,
          boxShadow: affordable
            ? `0 4px 20px -4px ${accent}40`
            : "0 2px 8px -2px rgba(148,163,184,0.18)",
          opacity: affordable ? 1 : 0.72,
        }}
      >
        {/* Inner core */}
        <div
          className="relative p-4 flex flex-col items-start gap-2 overflow-hidden"
          style={{
            borderRadius: "calc(2rem - 0.375rem)",
            background: affordable
              ? "rgba(255,255,255,0.95)"
              : "rgba(255,255,255,0.75)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
          }}
        >
          {/* Shimmer on affordable cards */}
          {affordable && (
            <div
              className="animate-shimmer pointer-events-none absolute inset-0"
              style={{ borderRadius: "inherit", zIndex: 0 }}
              aria-hidden
            />
          )}

          {/* Lock badge */}
          {!affordable && (
            <div
              className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: "rgba(148,163,184,0.15)",
                border: "1px solid rgba(148,163,184,0.3)",
              }}
            >
              <Lock className="size-2.5 text-slate-400" strokeWidth={2.5} />
              <span className="font-fredoka text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Lock
              </span>
            </div>
          )}

          {/* Emoji bubble */}
          <div
            className="relative z-10 size-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: bg }}
          >
            {reward.emoji ?? "🎁"}
          </div>

          {/* Title + description */}
          <div className="relative z-10 flex-1 min-w-0 w-full">
            <p className="font-fredoka text-sm font-semibold leading-tight text-gray-800 line-clamp-2">
              {reward.name}
            </p>
            {reward.description && (
              <p className="font-fredoka text-xs text-gray-400 mt-0.5 line-clamp-2">
                {reward.description}
              </p>
            )}
          </div>

          {/* Points + claim button row */}
          <div className="relative z-10 flex items-center justify-between w-full mt-0.5">
            <span
              className="font-fredoka text-sm font-bold"
              style={{ color: accent }}
            >
              ⭐ {reward.cost_points} pts
            </span>

            {affordable && (
              <div className="relative">
                <div
                  ref={rippleRef}
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `${accent}55`,
                    opacity: 0,
                    transformOrigin: "center",
                  }}
                  aria-hidden
                />
                <m.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.86 }}
                  onClick={handleClaim}
                  className="relative size-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${darkenHex(accent)})`,
                    border: "2px solid rgba(255,255,255,0.35)",
                    boxShadow: `0 4px 12px -2px ${accent}55`,
                  }}
                  aria-label={`Canjear: ${reward.name}`}
                >
                  <span
                    className="text-white font-black text-lg leading-none select-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                  >
                    ✓
                  </span>
                </m.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}

// ── Money Exchange Card ───────────────────────────────────────────────────────

function MoneyExchangeCard({
  config,
  availableBalance,
  onOpen,
}: {
  config: { rate: number; currency: string };
  availableBalance: number;
  onOpen: () => void;
}) {
  const accent = "#F59E0B";
  const rippleRef = useRef<HTMLDivElement>(null);

  function handleClick() {
    if (rippleRef.current) triggerAnimeRipple(rippleRef.current);
    onOpen();
  }

  return (
    <div
      className="rounded-[2rem]"
      style={{
        background: "linear-gradient(135deg, #FFF9E6, #FEF3C7)",
        border: "1px solid rgba(245,158,11,0.35)",
        boxShadow: "0 6px 24px -6px rgba(245,158,11,0.45)",
      }}
    >
      <div
        className="relative flex items-center gap-4 p-4 overflow-hidden"
        style={{
          borderRadius: "calc(2rem - 0.375rem)",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
        }}
      >
        <div
          className="animate-shimmer pointer-events-none absolute inset-0"
          style={{ borderRadius: "inherit", zIndex: 0 }}
          aria-hidden
        />

        {/* Animated coin */}
        <div
          className="relative z-10 size-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 animate-flame"
          style={{ background: "#FFF9E6" }}
        >
          💰
        </div>

        {/* Info */}
        <div className="relative z-10 flex-1 min-w-0">
          <p className="font-fredoka text-base font-bold text-amber-800 leading-tight">
            Canjear por Dinero
          </p>
          <p className="font-fredoka text-xs text-amber-600/80 mt-0.5">
            1 pt = {config.rate.toFixed(2)} {config.currency}
          </p>
          <p className="font-fredoka text-xs text-amber-500 mt-0.5">
            <strong>{availableBalance}</strong> pts disponibles
          </p>
        </div>

        {/* Action button */}
        <div className="relative z-10 shrink-0">
          <div
            ref={rippleRef}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `${accent}55`, opacity: 0, transformOrigin: "center" }}
            aria-hidden
          />
          <m.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.88 }}
            onClick={handleClick}
            className="relative size-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${darkenHex(accent)})`,
              border: "2px solid rgba(255,255,255,0.35)",
              boxShadow: `0 4px 16px -2px ${accent}55`,
            }}
            aria-label="Canjear puntos por dinero"
          >
            💸
          </m.button>
        </div>
      </div>
    </div>
  );
}

// ── History Item ──────────────────────────────────────────────────────────────

function HistoryItem({
  redemption,
  currency,
}: {
  redemption: RedemptionRow;
  currency?: string;
}) {
  const isMoney = redemption.rewards?.type === "money_exchange";
  const status =
    STATUS_CONFIG[redemption.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;

  return (
    <m.div variants={cardVariants}>
      <div
        className="rounded-[1.5rem]"
        style={{
          background: status.bg,
          border: `1px solid ${status.accent}28`,
          boxShadow: `0 2px 10px -2px ${status.accent}22`,
        }}
      >
        <div
          className="flex items-center gap-3 p-3"
          style={{
            borderRadius: "calc(1.5rem - 0.25rem)",
            background: "rgba(255,255,255,0.88)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <span className="text-2xl leading-none shrink-0">
            {isMoney ? "💰" : (redemption.rewards?.emoji ?? "🎁")}
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-fredoka text-sm font-semibold text-gray-800 truncate">
              {isMoney ? "Canje por Dinero" : redemption.rewards?.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 font-fredoka text-[11px] font-bold"
                style={{
                  background: `${status.accent}22`,
                  color: status.accent,
                }}
              >
                {status.emoji} {status.label}
              </span>
              {isMoney && redemption.money_value_at_redemption != null && (
                <span className="font-fredoka text-xs font-semibold text-emerald-600">
                  → {redemption.money_value_at_redemption.toFixed(2)} {currency ?? ""}
                </span>
              )}
            </div>
          </div>

          <span
            className="font-fredoka text-sm font-bold shrink-0"
            style={{ color: status.accent }}
          >
            -{redemption.cost_points_at_redemption} pts
          </span>
        </div>
      </div>
    </m.div>
  );
}

// ── Confirm Bottom Sheet ──────────────────────────────────────────────────────

function ConfirmSheet({
  reward,
  colors,
  availableBalance,
  loading,
  onConfirm,
  onCancel,
}: {
  reward: Reward;
  colors: { accent: string; bg: string };
  availableBalance: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { accent, bg } = colors;
  const rippleRef = useRef<HTMLDivElement>(null);
  const remaining = availableBalance - reward.cost_points;

  function handleConfirm() {
    if (rippleRef.current) triggerAnimeRipple(rippleRef.current);
    onConfirm();
  }

  return (
    <>
      {/* Backdrop */}
      <m.div
        key="confirm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
        onClick={onCancel}
      />

      {/* Sheet */}
      <m.div
        key="confirm-sheet"
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed bottom-0 inset-x-0 z-50 rounded-t-[2.5rem]"
        style={{
          background: bg,
          border: `1px solid ${accent}33`,
          boxShadow: `0 -8px 40px -8px ${accent}45`,
          paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
        }}
      >
        <div
          className="p-6 space-y-5 text-center"
          style={{
            borderRadius: "calc(2.5rem - 0.25rem) calc(2.5rem - 0.25rem) 0 0",
            background: "rgba(255,255,255,0.97)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
          }}
        >
          {/* Drag handle */}
          <div
            className="w-10 h-1 rounded-full mx-auto"
            style={{ background: `${accent}45` }}
          />

          {/* Emoji bubble with spring entrance */}
          <m.div
            initial={{ scale: 0, rotate: -18 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.08 }}
            className="size-24 rounded-[2rem] flex items-center justify-center text-5xl mx-auto"
            style={{
              background: bg,
              boxShadow: `0 8px 28px -6px ${accent}55`,
            }}
          >
            {reward.emoji ?? "🎁"}
          </m.div>

          {/* Name + description */}
          <div className="space-y-1">
            <h2 className="font-fredoka text-2xl font-bold text-gray-800">
              {reward.name}
            </h2>
            {reward.description && (
              <p className="font-fredoka text-sm text-gray-500">
                {reward.description}
              </p>
            )}
          </div>

          {/* Points breakdown card */}
          <div
            className="rounded-2xl p-4 space-y-2 text-left"
            style={{
              background: `${accent}10`,
              border: `1px solid ${accent}25`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-fredoka text-sm text-gray-500">Coste</span>
              <span
                className="font-fredoka text-xl font-bold"
                style={{ color: accent }}
              >
                ⭐ {reward.cost_points} pts
              </span>
            </div>
            <div className="h-px" style={{ background: `${accent}20` }} />
            <div className="flex items-center justify-between">
              <span className="font-fredoka text-sm text-gray-500">
                Te quedarán
              </span>
              <span className="font-fredoka text-base font-semibold text-gray-600">
                {Math.max(0, remaining)} pts
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="flex-1 h-12 rounded-2xl font-fredoka text-sm font-semibold"
              style={{
                background: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#6b7280",
              }}
            >
              Cancelar
            </m.button>

            <div className="relative flex-1">
              <div
                ref={rippleRef}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `${accent}55`,
                  opacity: 0,
                  transformOrigin: "center",
                }}
                aria-hidden
              />
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                disabled={loading}
                onClick={handleConfirm}
                className="relative w-full h-12 rounded-2xl font-fredoka text-sm font-bold text-white"
                style={{
                  background: loading
                    ? "#d1d5db"
                    : `linear-gradient(135deg, ${accent}, ${darkenHex(accent)})`,
                  border: "2px solid rgba(255,255,255,0.35)",
                  boxShadow: loading ? "none" : `0 6px 20px -4px ${accent}60`,
                }}
              >
                {loading ? "Canjeando…" : "Canjear ✨"}
              </m.button>
            </div>
          </div>
        </div>
      </m.div>
    </>
  );
}

// ── Money Exchange Sheet ──────────────────────────────────────────────────────

function MoneyExchangeSheet({
  config,
  availableBalance,
  moneyPoints,
  moneyPreview,
  moneyPtsNum,
  loading,
  onPointsChange,
  onConfirm,
  onCancel,
}: {
  config: { rate: number; currency: string };
  availableBalance: number;
  moneyPoints: string;
  moneyPreview: string | null;
  moneyPtsNum: number;
  loading: boolean;
  onPointsChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const accent = "#F59E0B";
  const rippleRef = useRef<HTMLDivElement>(null);
  const insufficient = !isNaN(moneyPtsNum) && moneyPtsNum > availableBalance;
  const canSubmit = !loading && !!moneyPreview && !insufficient && !isNaN(moneyPtsNum) && moneyPtsNum >= 1;

  function handleConfirm() {
    if (rippleRef.current) triggerAnimeRipple(rippleRef.current);
    onConfirm();
  }

  return (
    <>
      <m.div
        key="money-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
        onClick={onCancel}
      />

      <m.div
        key="money-sheet"
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed bottom-0 inset-x-0 z-50 rounded-t-[2.5rem]"
        style={{
          background: "#FFF9E6",
          border: "1px solid rgba(245,158,11,0.35)",
          boxShadow: "0 -8px 40px -8px rgba(245,158,11,0.4)",
          paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
        }}
      >
        <div
          className="p-6 space-y-5"
          style={{
            borderRadius: "calc(2.5rem - 0.25rem) calc(2.5rem - 0.25rem) 0 0",
            background: "rgba(255,255,255,0.97)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)",
          }}
        >
          {/* Handle */}
          <div
            className="w-10 h-1 rounded-full mx-auto"
            style={{ background: "rgba(245,158,11,0.4)" }}
          />

          {/* Header */}
          <div className="text-center space-y-2">
            <m.div
              initial={{ scale: 0, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.08 }}
              className="size-20 rounded-[1.75rem] flex items-center justify-center text-4xl mx-auto animate-flame"
              style={{
                background: "#FFF9E6",
                boxShadow: "0 8px 24px -6px rgba(245,158,11,0.5)",
              }}
            >
              💰
            </m.div>
            <h2 className="font-fredoka text-2xl font-bold text-amber-800">
              Canjear por Dinero
            </h2>
            <p className="font-fredoka text-sm text-amber-600/80">
              1 pt = {config.rate.toFixed(2)} {config.currency}
            </p>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="font-fredoka text-sm font-semibold text-gray-700 block">
              ¿Cuántos puntos quieres canjear?
            </label>
            <div
              className="rounded-2xl transition-all duration-200"
              style={{
                background: "#FFF9E6",
                border: `2px solid ${insufficient ? "#EF4444" : "rgba(245,158,11,0.4)"}`,
                boxShadow: insufficient
                  ? "0 0 0 4px rgba(239,68,68,0.1)"
                  : "0 0 0 4px rgba(245,158,11,0.08)",
              }}
            >
              <input
                type="number"
                min={1}
                max={availableBalance}
                value={moneyPoints}
                onChange={(e) => onPointsChange(e.target.value)}
                placeholder="Ej: 50"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="w-full bg-transparent px-4 py-3 font-fredoka text-xl font-semibold text-amber-800 text-center outline-none placeholder:text-amber-300"
              />
            </div>
            {insufficient && (
              <p className="font-fredoka text-xs text-red-500 text-center">
                No tienes suficientes puntos disponibles
              </p>
            )}
          </div>

          {/* Live preview */}
          <AnimatePresence>
            {moneyPreview && !insufficient && (
              <m.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="rounded-2xl p-4 text-center space-y-1"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <p className="font-fredoka text-3xl font-bold text-amber-600">
                  {moneyPreview} {config.currency}
                </p>
                <p className="font-fredoka text-sm text-amber-500">
                  Te quedarán{" "}
                  <strong>{availableBalance - moneyPtsNum} pts</strong>
                </p>
              </m.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-3">
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="flex-1 h-12 rounded-2xl font-fredoka text-sm font-semibold"
              style={{
                background: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#6b7280",
              }}
            >
              Cancelar
            </m.button>

            <div className="relative flex-1">
              <div
                ref={rippleRef}
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `${accent}55`,
                  opacity: 0,
                  transformOrigin: "center",
                }}
                aria-hidden
              />
              <m.button
                whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit ? 0.94 : 1 }}
                disabled={!canSubmit}
                onClick={handleConfirm}
                className="relative w-full h-12 rounded-2xl font-fredoka text-sm font-bold text-white"
                style={{
                  background: canSubmit
                    ? `linear-gradient(135deg, ${accent}, ${darkenHex(accent)})`
                    : "#d1d5db",
                  border: "2px solid rgba(255,255,255,0.35)",
                  boxShadow: canSubmit
                    ? `0 6px 20px -4px ${accent}60`
                    : "none",
                }}
              >
                {loading ? "Canjeando…" : "Canjear 💰"}
              </m.button>
            </div>
          </div>
        </div>
      </m.div>
    </>
  );
}
