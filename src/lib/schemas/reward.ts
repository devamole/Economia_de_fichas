import { z } from "zod";

export const rewardSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(60),
  description: z.string().max(200).optional(),
  costPoints: z.coerce.number().int().min(1, "Mínimo 1 punto").max(9999),
  emoji: z.string().max(8).optional(),
});

export type RewardFormValues = z.infer<typeof rewardSchema>;
