"use client";

import { db } from "./db";
import type { MutationType } from "./db";

export class PermanentError extends Error {
  readonly isPermanent = true;
}

const MAX_RETRIES = 5;

function backoffMs(retries: number): number {
  return Math.min(2 ** retries * 1000, 30_000);
}

export async function enqueue(type: MutationType, payload: Record<string, string>) {
  await db.pendingMutations.add({
    type,
    payload,
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
    nextRetryAt: 0,
  });
}

export async function flushQueue(
  handlers: Partial<Record<MutationType, (payload: Record<string, string>) => Promise<unknown>>>,
): Promise<{ flushed: number; errors: number }> {
  const now = Date.now();

  const pending = await db.pendingMutations
    .where("status")
    .anyOf(["pending", "error"])
    .and((m) => m.retries < MAX_RETRIES && (m.nextRetryAt ?? 0) <= now)
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
      const isPermanent = err instanceof PermanentError;
      const newRetries = mutation.retries + 1;

      if (isPermanent || newRetries >= MAX_RETRIES) {
        await db.pendingMutations.update(mutation.id, {
          status: "failed",
          errorMsg: err instanceof Error ? err.message : String(err),
          retries: newRetries,
        });
      } else {
        await db.pendingMutations.update(mutation.id, {
          status: "error",
          errorMsg: err instanceof Error ? err.message : String(err),
          retries: newRetries,
          nextRetryAt: Date.now() + backoffMs(newRetries),
        });
      }
      errors++;
    }
  }

  const cutoff = Date.now() - 60 * 60 * 1000;
  await db.pendingMutations
    .where("status")
    .equals("done")
    .and((m) => m.createdAt < cutoff)
    .delete();

  return { flushed, errors };
}

export async function getPendingCount(): Promise<number> {
  return db.pendingMutations.where("status").anyOf(["pending", "syncing", "error"]).count();
}
