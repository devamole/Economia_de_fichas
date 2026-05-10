"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { getUserLevel, LEVEL_THRESHOLDS } from "@/types";
import { BADGE_DEFINITIONS } from "@/lib/achievements";
import { LevelProgressBar } from "@/components/level-progress-bar";
import { PushSubscribeButton } from "@/components/push-subscribe";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import type { BadgeKey } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileClientProps {
  displayName: string;
  emoji: string;
  availablePoints: number;
  pendingPoints: number;
  totalPoints: number;
  unlockedKeys: string[];
  family: { name: string; family_code: string } | null;
}

// ── Framer Motion variants ───────────────────────────────────────────────────

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

// ── Level tier system ────────────────────────────────────────────────────────

function getLevelTier(level: number) {
  if (level >= LEVEL_THRESHOLDS.length)
    return {
      accent: "#f59e0b",
      emoji: "✨",
      label: "MAX",
      gradient: "linear-gradient(135deg,#fef9c3,#fde68a)",
      bg: "#FFF9C3",
    };
  if (level >= 6)
    return {
      accent: "#d946ef",
      emoji: "🌟",
      label: "Leyenda",
      gradient: "linear-gradient(135deg,#fae8ff,#ede9fe)",
      bg: "#FAE8FF",
    };
  if (level >= 4)
    return {
      accent: "#7c3aed",
      emoji: "⚡",
      label: "Héroe",
      gradient: "linear-gradient(135deg,#f3e8ff,#ede9fe)",
      bg: "#F3E8FF",
    };
  if (level >= 2)
    return {
      accent: "#0ea5e9",
      emoji: "🌊",
      label: "Aventurero",
      gradient: "linear-gradient(135deg,#e0f2fe,#bfdbfe)",
      bg: "#E0F2FE",
    };
  return {
    accent: "#10b981",
    emoji: "🌱",
    label: "Principiante",
    gradient: "linear-gradient(135deg,#dcfce7,#d1fae5)",
    bg: "#DCFCE7",
  };
}

// ── Stat pill sub-component ──────────────────────────────────────────────────

interface StatPillProps {
  emoji: string;
  label: string;
  value: string | number;
  colorClass: string;
}

function StatPill({ emoji, label, value, colorClass }: StatPillProps) {
  return (
    <div
      className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 min-w-[88px] ${colorClass}`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xl font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[10px] font-medium opacity-70 whitespace-nowrap text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProfileClient({
  displayName,
  emoji,
  availablePoints,
  pendingPoints,
  totalPoints,
  unlockedKeys,
  family,
}: ProfileClientProps) {
  const [copied, setCopied] = useState(false);

  const unlockedSet = new Set(unlockedKeys);
  const unlockedCount = unlockedKeys.length;
  const level = getUserLevel(totalPoints);
  const tier = getLevelTier(level);

  async function copyCode() {
    if (!family) return;
    try {
      await navigator.clipboard.writeText(family.family_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <main className="child-page flex flex-col flex-1 gap-0 pb-4 overflow-hidden">
      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-blob-a absolute -top-20 -left-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-blob-b absolute top-36 -right-16 size-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="animate-blob-c absolute bottom-72 -left-12 size-48 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="animate-blob-d absolute -bottom-12 right-8 size-52 rounded-full bg-fuchsia-300/15 blur-3xl" />
      </div>

      {/* ── Scrollable content ── */}
      <m.div
        className="relative z-10 flex flex-col gap-4 px-5 pt-8 pb-6"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Hero ── */}
        <m.div
          variants={itemVariants}
          className="flex flex-col items-center gap-3 pb-2"
        >
          {/* Avatar double-bezel */}
          <div className="p-1.5 rounded-full ring-1 ring-primary/20 bg-primary/5">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_12px_rgba(124,58,237,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)]">
              <m.span
                className="text-6xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {emoji}
              </m.span>
            </div>
          </div>

          {/* Name */}
          <h1 className="font-fredoka text-3xl font-semibold text-foreground">
            {displayName}
          </h1>

          {/* Level eyebrow badge */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ backgroundColor: `${tier.accent}18`, color: tier.accent }}
          >
            <span className="text-sm">{tier.emoji}</span>
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
              {tier.label}
            </span>
          </div>

          {/* Points pill */}
          <div className="flex items-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-primary to-[#4f46e5] text-white shadow-[0_4px_20px_-4px_rgba(124,58,237,0.45)]">
            <span className="text-lg">⭐</span>
            <span className="text-2xl font-bold tabular-nums">{availablePoints}</span>
            <span className="text-sm opacity-80">pts disponibles</span>
          </div>

          {/* Pending badge */}
          {pendingPoints > 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 rounded-full px-4 py-1.5 bg-amber-100 border border-amber-200/80">
                <span className="text-base leading-none">⏳</span>
                <span className="text-sm font-bold text-amber-700">
                  +{pendingPoints} pts en camino
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-[230px] text-center leading-relaxed">
                ¡Ya casi son tuyos! En cuanto lo aprueben los tendrás listos ✨
              </p>
            </div>
          )}
        </m.div>

        {/* ── Stats strip ── */}
        <m.div
          variants={itemVariants}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-5 px-5"
        >
          <StatPill
            emoji="💰"
            label="Total ganados"
            value={totalPoints}
            colorClass="bg-amber-50 border-amber-200 text-amber-800"
          />
          <StatPill
            emoji="⚡"
            label="Nivel actual"
            value={level}
            colorClass="bg-violet-50 border-violet-200 text-violet-800"
          />
          <StatPill
            emoji="🏅"
            label="Logros"
            value={`${unlockedCount}/6`}
            colorClass="bg-emerald-50 border-emerald-200 text-emerald-800"
          />
        </m.div>

        {/* ── Level card ── */}
        <m.div variants={itemVariants} className="w-full">
          {/* Outer shell — tier gradient */}
          <div
            className="p-1.5 rounded-[2rem] ring-1 ring-black/5"
            style={{ background: tier.gradient }}
          >
            {/* Inner core */}
            <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground mb-1">
                    Progreso de nivel
                  </p>
                  <p
                    className="font-fredoka text-4xl font-semibold leading-none"
                    style={{ color: tier.accent }}
                  >
                    Nivel {level}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: `${tier.accent}18` }}
                >
                  {tier.emoji}
                </div>
              </div>
              <LevelProgressBar totalPoints={totalPoints} />
              <p className="text-xs text-muted-foreground mt-2">
                {totalPoints} pts totales ganados
              </p>
            </div>
          </div>
        </m.div>

        {/* ── Achievements bento ── */}
        <m.div variants={itemVariants} className="w-full">
          {/* Outer shell */}
          <div className="p-1.5 rounded-[2rem] ring-1 ring-amber-200/60 bg-amber-50/30">
            {/* Inner core */}
            <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                  Logros
                </span>
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">
                  {unlockedCount}/6
                </span>
              </div>

              {/* 2-column grid */}
              <m.div
                className="grid grid-cols-2 gap-3"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                {BADGE_DEFINITIONS.map((badge) => {
                  const unlocked = unlockedSet.has(badge.key as BadgeKey);
                  return (
                    <m.div
                      key={badge.key}
                      variants={badgeVariants}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center overflow-hidden ${
                        unlocked
                          ? "bg-gradient-to-b from-amber-50 to-yellow-50 border border-amber-200/80"
                          : "bg-muted/30 border border-border opacity-60"
                      }`}
                    >
                      {/* Radial glow for unlocked */}
                      {unlocked && (
                        <div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{
                            background:
                              "radial-gradient(circle at 50% 30%,rgba(251,191,36,0.18) 0%,transparent 70%)",
                          }}
                        />
                      )}

                      {/* Checkmark chip (unlocked) */}
                      {unlocked && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold leading-none">✓</span>
                        </div>
                      )}

                      {/* Emoji */}
                      <span
                        className={`relative z-10 text-4xl ${
                          unlocked
                            ? "animate-[flame-pulse_3.5s_ease-in-out_infinite]"
                            : "grayscale"
                        }`}
                      >
                        {badge.emoji}
                      </span>

                      {/* Text */}
                      <div className="relative z-10">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            unlocked ? "text-amber-900" : "text-muted-foreground"
                          }`}
                        >
                          {badge.title}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 leading-tight ${
                            unlocked ? "text-amber-700" : "text-muted-foreground/60"
                          }`}
                        >
                          {badge.description}
                        </p>
                      </div>

                      {/* Lock */}
                      {!unlocked && (
                        <span className="relative z-10 text-[10px] text-muted-foreground/50">
                          🔒
                        </span>
                      )}
                    </m.div>
                  );
                })}
              </m.div>
            </div>
          </div>
        </m.div>

        {/* ── Family card ── */}
        {family && (
          <m.div variants={itemVariants} className="w-full">
            {/* Outer shell — amber gradient */}
            <div
              className="p-1.5 rounded-[2rem] ring-1 ring-amber-200/60"
              style={{ background: "linear-gradient(135deg,#FFF9E6,#FEF3C7)" }}
            >
              {/* Inner core */}
              <div className="rounded-[calc(2rem-0.375rem)] bg-white/92 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                    🏡
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground">
                      Tu familia
                    </p>
                    <p className="font-fredoka text-xl font-semibold text-foreground leading-tight">
                      {family.name}
                    </p>
                  </div>
                </div>

                {/* Code box */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-[10px] font-medium text-amber-700 mb-1">
                    Código familiar
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-2xl font-bold tracking-widest text-primary">
                      {family.family_code}
                    </p>
                    <button
                      onClick={copyCode}
                      className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg px-3 py-1.5 transition-all active:scale-95 flex-shrink-0"
                    >
                      {copied ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        )}

        {/* ── Notifications card ── */}
        <m.div variants={itemVariants} className="w-full">
          <div className="p-1.5 rounded-[2rem] ring-1 ring-border/60 bg-muted/20">
            <div className="rounded-[calc(2rem-0.375rem)] bg-white/95 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
              <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground mb-3">
                Notificaciones
              </p>
              <PushSubscribeButton />
            </div>
          </div>
        </m.div>

        {/* ── Sign out ── */}
        <m.div variants={itemVariants} className="w-full mt-2">
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              Cerrar sesión
            </Button>
          </form>
        </m.div>
      </m.div>
    </main>
  );
}
