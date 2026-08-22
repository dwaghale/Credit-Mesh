"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { rpc } from "@stellar/stellar-sdk";
import { server } from "@/lib/stellar";
import { useTxStore, type TxRecord } from "@/store/tx-store";

/**
 * Keeps polling any PENDING transactions (e.g. ones submitted before a page
 * switch or RPC timeout) until they resolve.
 */
export function useTransactionTracker() {
  const transactions = useTxStore((s) => s.transactions);
  const updateStatus = useTxStore((s) => s.updateStatus);
  const queryClient = useQueryClient();

  useEffect(() => {
    const pending: TxRecord[] = transactions.filter((t) => t.status === "PENDING");
    if (pending.length === 0) return;
    let cancelled = false;

    const tick = async () => {
      await Promise.all(
        pending.map(async (tx) => {
          try {
            const res = await server().getTransaction(tx.hash);
            if (cancelled) return;
            if (
              res.status === rpc.Api.GetTransactionStatus.SUCCESS ||
              res.status === rpc.Api.GetTransactionStatus.FAILED
            ) {
              const ok = res.status === rpc.Api.GetTransactionStatus.SUCCESS;
              updateStatus(tx.hash, ok ? "SUCCESS" : "FAILED");
              queryClient.invalidateQueries();
            }
          } catch {
            /* transient — retry on next tick */
          }
        }),
      );
    };

    const id = setInterval(tick, 5_000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [transactions, updateStatus, queryClient]);
}
