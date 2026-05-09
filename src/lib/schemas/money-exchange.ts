import { z } from "zod";

export const moneyExchangeSchema = z.object({
  rate: z.coerce.number().positive("La tasa debe ser mayor que 0.").max(9999),
  currency: z.string().min(1, "Selecciona una moneda.").max(10),
  enabled: z.boolean(),
});

export type MoneyExchangeConfig = z.infer<typeof moneyExchangeSchema>;
