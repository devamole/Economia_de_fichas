import type { BadgeKey } from "@/types";

export interface BadgeDef {
  key: BadgeKey;
  emoji: string;
  title: string;
  description: string;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  { key: "first_task",    emoji: "⭐", title: "¡Primera tarea!",   description: "Completaste tu primera tarea" },
  { key: "streak_3",     emoji: "🔥", title: "En racha",          description: "3 días consecutivos" },
  { key: "streak_7",     emoji: "🏆", title: "Una semana",         description: "7 días consecutivos" },
  { key: "streak_30",    emoji: "💎", title: "Imparable",         description: "30 días consecutivos" },
  { key: "first_epic",   emoji: "👑", title: "Primer Boost Épico", description: "Conseguiste tu primer OYEE" },
  { key: "king_of_boost", emoji: "🎰", title: "Rey del Boost",    description: "5 boosts épicos conseguidos" },
];

export function getBadge(key: BadgeKey): BadgeDef {
  return BADGE_DEFINITIONS.find((b) => b.key === key) ?? BADGE_DEFINITIONS[0]!;
}
