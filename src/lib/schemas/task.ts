import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  assignedTo: z.string().uuid(),
  points: z.coerce.number().int().min(1).max(9999),
  emoji: z.string().min(1).max(8),
  recurrenceType: z.enum(["once", "daily", "weekly", "custom"]),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(),
  dueTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
  startDate: z.string().min(1),
  endDate: z.string().optional().or(z.literal("")),
  requiresApproval: z.coerce.boolean().default(false),
});

export type TaskInput = z.infer<typeof taskSchema>;
