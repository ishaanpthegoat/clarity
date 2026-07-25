// Clarity — optimistic mutations.
//
// The rule: the UI commits the moment you tap. Nothing in this app waits on a
// spinner to tell you your own checkbox is ticked. If the write behind it ever
// fails, we put the old value back and say so — a rollback the user can see is
// honest; a spinner on every tap is just slow.
//
// Everything here is storage-agnostic. Today `commit` writes to localStorage
// and resolves; when a real backend lands, only `commit` changes.

import { useCallback, useRef, useState } from "react";
import { note } from "./feedback";

export interface OptimisticRun<T> {
  /** Applied synchronously, before `commit` is even called. */
  apply: () => void;
  /** Puts the world back the way it was. Must be safe to call twice. */
  rollback: () => void;
  /** The real write. Throwing (or rejecting) triggers `rollback`. */
  commit: () => Promise<T>;
  /** Shown in a toast when `commit` fails. */
  errorMessage?: string;
  errorDetail?: string;
}

/**
 * Fire an optimistic mutation.
 *
 * Resolves to the commit's value, or `null` if it failed and was rolled back —
 * callers that care can branch on that, callers that don't can ignore it.
 */
export async function runOptimistic<T>({
  apply,
  rollback,
  commit,
  errorMessage = "That didn't save",
  errorDetail = "We put it back the way it was.",
}: OptimisticRun<T>): Promise<T | null> {
  apply();
  try {
    return await commit();
  } catch {
    rollback();
    note(errorMessage, errorDetail);
    return null;
  }
}

/**
 * A value with an optimistic override sitting on top of it.
 *
 * `value` is what to render: the pending guess while a write is in flight, and
 * the real thing once it settles. `isPending` exists for the rare control that
 * genuinely must show it is busy — most should not.
 */
export function useOptimistic<T>(actual: T) {
  const [pendingValue, setPendingValue] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  // Survives re-renders so a second tap during flight cancels the first.
  const runId = useRef(0);

  const mutate = useCallback(
    async <R,>(next: T, commit: () => Promise<R>, errorMessage?: string): Promise<R | null> => {
      const id = ++runId.current;
      setPendingValue(next);
      setIsPending(true);
      try {
        const result = await commit();
        // A newer tap already owns the value — leave its guess alone.
        if (runId.current === id) {
          setPendingValue(null);
          setIsPending(false);
        }
        return result;
      } catch {
        if (runId.current === id) {
          setPendingValue(null);
          setIsPending(false);
          note(errorMessage ?? "That didn't save", "We put it back the way it was.");
        }
        return null;
      }
    },
    [],
  );

  return {
    value: pendingValue !== null ? pendingValue : actual,
    isPending,
    mutate,
  };
}

/**
 * Stand-in for a network write.
 *
 * Deliberately not instant: a mutation that resolves in the same tick can hide
 * ordering bugs that only show up against real latency. `failureRate` is here
 * so the rollback path can actually be exercised in development.
 */
export function simulateWrite(ms = 320, failureRate = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (failureRate > 0 && Math.random() < failureRate) {
        reject(new Error("write failed"));
        return;
      }
      resolve();
    }, ms);
  });
}
