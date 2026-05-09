"use client";

import { useActionState, useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { configureMoneyExchange } from "@/server/actions/rewards";

export interface MoneyExchangeConfig {
  rate: number | null;
  currency: string | null;
  enabled: boolean;
}

const CURRENCIES = [
  { code: "USD", label: "USD — Dólar estadounidense" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "COP", label: "COP — Peso colombiano" },
  { code: "ARS", label: "ARS — Peso argentino" },
  { code: "VES", label: "VES — Bolívar venezolano" },
  { code: "GBP", label: "GBP — Libra esterlina" },
  { code: "BRL", label: "BRL — Real brasileño" },
  { code: "CLP", label: "CLP — Peso chileno" },
  { code: "PEN", label: "PEN — Sol peruano" },
];

export function MoneyExchangeSettings({ initialConfig }: { initialConfig: MoneyExchangeConfig }) {
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [rate, setRate] = useState(initialConfig.rate?.toString() ?? "");
  const [currency, setCurrency] = useState(initialConfig.currency ?? "USD");

  const [state, action, pending] = useActionState(configureMoneyExchange, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state !== null) toast.success("Configuración guardada ✅");
  }, [state]);

  const rateNum = parseFloat(rate);
  const previewMoney = !isNaN(rateNum) && rateNum > 0
    ? (100 * rateNum).toFixed(2)
    : null;

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <DollarSign className="size-4 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">Canje por dinero</p>
            <p className="text-xs text-muted-foreground truncate">
              {enabled ? "Los niños pueden canjear puntos" : "Función deshabilitada"}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {/* Rate and currency config */}
      <div className="space-y-3 rounded-xl border border-border p-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tasa de cambio</p>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground shrink-0">1 punto =</span>
          <Input
            type="number"
            min="0.0001"
            max="9999"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="h-8 w-28 text-center"
            placeholder="0.10"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>

        {previewMoney && (
          <p className="text-xs text-muted-foreground">
            Vista previa: 100 pts → <strong>{previewMoney} {currency}</strong>
          </p>
        )}
      </div>

      <form action={action}>
        <input type="hidden" name="rate" value={rate} />
        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="enabled" value={String(enabled)} />
        <Button type="submit" disabled={pending} className="w-full rounded-xl h-10">
          {pending ? "Guardando…" : "Guardar configuración"}
        </Button>
      </form>
    </div>
  );
}
