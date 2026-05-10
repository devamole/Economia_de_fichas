"use client";

import { m } from "framer-motion";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  ListChecks,
  Users,
  Gift,
  CheckCircle,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
};

const parentNav: NavItem[] = [
  { href: "/parent/tasks", icon: ListChecks, label: "Tareas" },
  { href: "/parent/children", icon: Users, label: "Hijos" },
  { href: "/parent/rewards", icon: Gift, label: "Recompensas" },
  { href: "/parent/approvals", icon: CheckCircle, label: "Aprobar" },
];

const childNav: NavItem[] = [
  { href: "/child/today", icon: ListChecks, label: "Hoy" },
  { href: "/child/calendar", icon: CalendarDays, label: "Calendario" },
  { href: "/child/rewards", icon: Gift, label: "Recompensas" },
  { href: "/child/profile", icon: User, label: "Perfil" },
];

interface BottomNavProps {
  role: "parent" | "child";
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = role === "parent" ? parentNav : childNav;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
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
