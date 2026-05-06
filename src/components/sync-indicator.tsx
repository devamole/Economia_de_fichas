"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { db } from "@/lib/offline/db";

export function SyncIndicator() {
  const isOnline = useOnlineStatus();
  const pendingCount =
    useLiveQuery(
      () => db.pendingMutations.where("status").anyOf(["pending", "error"]).count(),
      [],
    ) ?? 0;

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
        !isOnline
          ? "bg-destructive text-destructive-foreground"
          : "bg-amber-500 text-white"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="size-4" />
          Sin conexión
        </>
      ) : (
        <>
          <RefreshCw className="size-4 animate-spin" />
          {`Sincronizando ${pendingCount} acción${pendingCount !== 1 ? "es" : ""}…`}
        </>
      )}
    </div>
  );
}
