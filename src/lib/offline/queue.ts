"use client";

import { db } from "./db";
import type { MutationType } from "./db";

export async function enqueue(type: MutationType, payload: Record<string, string>) {
  await db.pendingMutations.add({
    type,
    payload,
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
  });
}

export async function flushQueue(
  handlers: Partial<Record<MutationType, (payload: Record<string, string>) => Promise<unknown>>>,
): Promise<{ flushed: number; errors: number }> {
  const pending = await db.pendingMutations
    .where("status")
    .anyOf(["pending", "error"])
    .and((m) => m.retries < 3)
    .toArray();

  let flushed = 0;
  let errors = 0;

  for (const mutation of pending) {
    if (!mutation.id) continue;
    await db.pendingMutations.update(mutation.id, { status: "syncing" });

    const handler = handlers[mutation.type];
    if (!handler) {
      await db.pendingMutations.update(mutation.id, { status: "done" });
      flushed++;
      continue;
    }

    try {
      await handler(mutation.payload);
      await db.pendingMutations.update(mutation.id, { status: "done" });
      flushed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await db.pendingMutations.update(mutation.id, {
        status: "error",
        errorMsg,
        retries: mutation.retries + 1,
      });
      errors++;
    }
  }

  // Clean up done mutations older than 1 hour
  const cutoff = Date.now() - 60 * 60 * 1000;
  await db.pendingMutations.where("status").equals("done").and((m) => m.createdAt < cutoff).delete();

  return { flushed, errors };
}

export async function getPendingCount(): Promise<number> {
  return db.pendingMutations.where("status").anyOf(["pending", "syncing", "error"]).count();
}
