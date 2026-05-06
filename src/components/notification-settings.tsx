"use client";

import { useState } from "react";
import { Bell, BellOff, CheckCircle, Gift } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPrefs, type NotificationPrefs } from "@/server/actions/push";

interface NotificationSettingsProps {
  initialPrefs: NotificationPrefs;
}

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [loading, setLoading] = useState<keyof NotificationPrefs | null>(null);

  async function toggle(key: keyof NotificationPrefs) {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setLoading(key);
    try {
      const result = await updateNotificationPrefs({ [key]: next });
      if (result.error) {
        setPrefs((p) => ({ ...p, [key]: !next }));
        toast.error(result.error);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <PrefRow
        icon={<CheckCircle className="size-4 text-success-emerald" />}
        label="Tareas completadas"
        description="Aviso cuando un hijo completa una tarea"
        checked={prefs.task_completions}
        disabled={loading === "task_completions"}
        onToggle={() => toggle("task_completions")}
      />
      <PrefRow
        icon={<Gift className="size-4 text-primary" />}
        label="Solicitudes de recompensa"
        description="Aviso cuando un hijo canjea una recompensa"
        checked={prefs.reward_redemptions}
        disabled={loading === "reward_redemptions"}
        onToggle={() => toggle("reward_redemptions")}
      />
    </div>
  );
}

function PrefRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  );
}

export function PushStatusBadge({ subscribed }: { subscribed: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {subscribed ? (
        <><Bell className="size-3 text-success-emerald" /> Notificaciones activas</>
      ) : (
        <><BellOff className="size-3" /> Notificaciones desactivadas</>
      )}
    </div>
  );
}
