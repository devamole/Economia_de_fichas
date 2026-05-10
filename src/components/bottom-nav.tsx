"use client";

import { m } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ListChecks, Users, Gift, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Parent nav ─────────────────────────────────────────────────────────────

type NavItem = { href: string; icon: React.ElementType; label: string };

const parentNav: NavItem[] = [
  { href: "/parent/tasks", icon: ListChecks, label: "Tareas" },
  { href: "/parent/children", icon: Users, label: "Hijos" },
  { href: "/parent/rewards", icon: Gift, label: "Recompensas" },
  { href: "/parent/approvals", icon: CheckCircle, label: "Aprobar" },
];

// ─── Child nav — custom playful SVG icons ───────────────────────────────────

function IconToday() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle with checkmark = "today's completed tasks" */}
      <circle cx="11.5" cy="13.5" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8.5 13.8L10.8 16L14.8 11.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkle — top right corner */}
      <path
        d="M17.5 5.5L18 3.5M19.8 7.8L21.8 7.2M18.5 4.2L20.2 2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="5" width="18" height="16" rx="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 3V7M16 3V7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Highlighted day dot */}
      <circle cx="12" cy="15.5" r="2" fill="currentColor" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Box */}
      <rect x="2.5" y="10.5" width="19" height="10.5" rx="2.5" stroke="currentColor" strokeWidth="2" />
      {/* Ribbon horizontal */}
      <path d="M2.5 15H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Ribbon vertical */}
      <path d="M12 10.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Left bow loop */}
      <path
        d="M12 10.5C11.5 8.5 9 7 8 8C7 9 8.5 10.5 12 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Right bow loop */}
      <path
        d="M12 10.5C12.5 8.5 15 7 16 8C17 9 15.5 10.5 12 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4.5 21C4.5 17.13 7.91 14 12 14C16.09 14 19.5 17.13 19.5 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Child nav data with per-section color theming ──────────────────────────

const childNavItems = [
  {
    href: "/child/today",
    label: "Hoy",
    color: "#F59E0B",
    activeBg: "#FFF9E6",
    activeBorder: "rgba(245,158,11,0.28)",
    activeGlow: "0 0 24px rgba(245,158,11,0.45)",
    Icon: IconToday,
  },
  {
    href: "/child/calendar",
    label: "Calendario",
    color: "#0EA5E9",
    activeBg: "#E0F2FE",
    activeBorder: "rgba(14,165,233,0.28)",
    activeGlow: "0 0 24px rgba(14,165,233,0.45)",
    Icon: IconCalendar,
  },
  {
    href: "/child/rewards",
    label: "Recompensas",
    color: "#A855F7",
    activeBg: "#F3E8FF",
    activeBorder: "rgba(168,85,247,0.28)",
    activeGlow: "0 0 24px rgba(168,85,247,0.45)",
    Icon: IconGift,
  },
  {
    href: "/child/profile",
    label: "Perfil",
    color: "#10B981",
    activeBg: "#ECFDF5",
    activeBorder: "rgba(16,185,129,0.28)",
    activeGlow: "0 0 24px rgba(16,185,129,0.45)",
    Icon: IconProfile,
  },
] as const;

// ─── Child Bottom Nav — Floating Glass Island ────────────────────────────────

function ChildBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      {/* Slide-up entry */}
      <m.div
        initial={{ y: 88, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.12 }}
      >
        {/* ── Outer glass shell (double-bezel outer ring) ── */}
        <div
          className="mx-4 mb-3 rounded-[2.25rem]"
          style={{
            padding: "6px",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 8px 40px -8px rgba(0,0,0,0.13)," +
              "0 1px 0 rgba(255,255,255,0.98) inset," +
              "0 0 0 1px rgba(0,0,0,0.055)",
          }}
        >
          {/* ── Inner core (double-bezel inner ring) ── */}
          <div
            className="flex items-stretch rounded-[1.875rem] px-1 py-2"
            style={{
              background: "rgba(255,255,255,0.94)",
              boxShadow:
                "inset 0 1.5px 2px rgba(255,255,255,1)," +
                "inset 0 -1px 0 rgba(0,0,0,0.04)",
            }}
          >
            {childNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const { Icon } = item;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative flex flex-1 items-center justify-center"
                  style={{ touchAction: "manipulation" }}
                >
                  {/* Item container — scales slightly when active */}
                  <m.div
                    className="relative flex min-w-[52px] flex-col items-center justify-center gap-[3px] rounded-[1.5rem] px-3 py-2.5"
                    style={{ color: isActive ? item.color : "#A3A3A3" }}
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  >
                    {/* ── Sliding colored pill background ── */}
                    {isActive && (
                      <m.div
                        layoutId="child-active-pill"
                        className="absolute inset-0 rounded-[1.5rem]"
                        style={{
                          backgroundColor: item.activeBg,
                          border: `1.5px solid ${item.activeBorder}`,
                          boxShadow: item.activeGlow,
                        }}
                        transition={{
                          layout: { type: "spring", stiffness: 360, damping: 30 },
                        }}
                      />
                    )}

                    {/* ── Icon — pops up when active ── */}
                    <m.div
                      className="relative z-10 shrink-0"
                      animate={
                        isActive ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }
                      }
                      transition={{ type: "spring", stiffness: 440, damping: 20 }}
                    >
                      <Icon />
                    </m.div>

                    {/* ── Label — Fredoka font ── */}
                    <span
                      className="relative z-10 shrink-0 text-[10px] font-semibold leading-none font-fredoka"
                      style={{
                        fontFamily:
                          "var(--font-fredoka), ui-sans-serif, system-ui, sans-serif",
                      }}
                    >
                      {item.label}
                    </span>
                  </m.div>
                </Link>
              );
            })}
          </div>
        </div>
      </m.div>
    </nav>
  );
}

// ─── Parent Bottom Nav (unchanged) ──────────────────────────────────────────

function ParentBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {parentNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-w-[56px] flex-1 flex-col items-center gap-1 py-2 px-1"
            >
              <m.div
                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "flex flex-col items-center gap-1",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {isActive && (
                  <m.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
                <Icon className="size-5 shrink-0" />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </m.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Exports ────────────────────────────────────────────────────────────────

interface BottomNavProps {
  role: "parent" | "child";
}

export function BottomNav({ role }: BottomNavProps) {
  if (role === "child") return <ChildBottomNav />;
  return <ParentBottomNav />;
}
