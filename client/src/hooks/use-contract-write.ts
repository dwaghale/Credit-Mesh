"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { server, NETWORK_PASSPHRASE } from "@/lib/stellar";
import { friendlyError } from "@/lib/errors";
import { useTxStore } from "@/store/tx-store";
import type { WriteResult } from "@/lib/contract";
import { rpc } from "@stellar/stellar-sdk";

/**
 * Executes a signed contract call:
 * wallet sign → submit → poll status → update tracker → toast → refresh data.
 */
export function useContractWrite() {
  const queryClient = useQueryClient();
  const { addPending, updateStatus } = useTxStore();

  const track = useCallback(
    async (hash: string, method: string) => {
      addPending(hash, method);
      const s = server();
      const started = Date.now();
      // Poll until the transaction resolves or ~90s elapse.
      while (Date.now() - started < 90_000) {
        await new Promise((r) => setTimeout(r, 3_000));
        try {
          const res = await s.getTransaction(hash);
          if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
            updateStatus(hash, "SUCCESS");
            toast.success(`${method} confirmed`, {
              description: `Transaction ${hash.slice(0, 8)}…${hash.slice(-6)}`,
            });
            await queryClient.invalidateQueries();
            return res;
          }
          if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
            updateStatus(hash, "FAILED");
            toast.error(`${method} failed on-chain`, {
              description: `Transaction ${hash.slice(0, 8)}…${hash.slice(-6)}`,
            });
            await queryClient.invalidateQueries();
            return res;
          }
        } catch {
          /* keep polling through transient RPC hiccups */
        }
      }
      // Timed out polling; leave as PENDING — Activity page keeps checking.
      toast.info(`${method} is still processing`, {
        description: "Track it in the Activity page.",
      });
      return null;
    },
    [addPending, updateStatus, queryClient],
  );

  const mutation = useMutation({
    mutationFn: async ({
      run,
    }: {
      run: () => Promise<WriteResult>;
      method: string;
    }) => {
      const res = await run();
      if (!res.hash) throw new Error("No transaction hash returned");
      return res;
    },
    onError: (err) => {
      toast.error(friendlyError(err));
    },
  });

  const execute = useCallback(
    async (method: string, run: () => Promise<WriteResult>) => {
      try {
        const res = await mutation.mutateAsync({ run, method });
        if (res.hash) {
          toast.info(`${method} submitted`, {
            description: "Waiting for confirmation…",
          });
          await track(res.hash, method);
        }
        return res;
      } catch (err) {
        toast.error(friendlyError(err));
        return null;
      }
    },
    [mutation, track],
  );

  return {
    execute,
    isPending: mutation.isPending,
  };
}

export { NETWORK_PASSPHRASE };
