"use client";

import { useCallback, useEffect, useRef } from "react";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { useWalletStore } from "@/store/wallet-store";
import { setSigningKit } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// v2.5 static API — initialize once at module load with all zero-config wallets
// (Freighter, Albedo, xBull, LOBSTR, Hana, Hot Wallet and more).
// Guarded so it only runs in the browser: this module is also evaluated
// during SSR/prerender, where `window` does not exist.
if (typeof window !== "undefined") {
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: defaultModules(),
  });

  // Expose the kit to the blockchain layer for transaction signing.
  setSigningKit(StellarWalletsKit);
}

export function useWallet() {
  const store = useWalletStore();
  const queryClient = useQueryClient();
  const restored = useRef(false);

  /** Silently restore a persisted session and verify it is still valid. */
  useEffect(() => {
    if (restored.current || !store.walletId || !store.address) return;
    restored.current = true;
    (async () => {
      try {
        StellarWalletsKit.setWallet(store.walletId!);
        const { address } = await StellarWalletsKit.getAddress();
        if (address && address.toLowerCase() !== store.address!.toLowerCase()) {
          store.setAddress(address);
        }
      } catch {
        store.disconnect();
        toast.info("Wallet session expired — please reconnect.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(async () => {
    try {
      // Opens the built-in multi-wallet selection modal and resolves with
      // the connected address after the user picks a wallet.
      const { address } = await StellarWalletsKit.authModal();
      const selected = StellarWalletsKit.selectedModule;
      store.setWallet({
        address,
        name: selected?.productName ?? "Wallet",
        id: selected?.productId ?? FREIGHTER_ID,
      });
      queryClient.invalidateQueries();
      toast.success(`Connected via ${selected?.productName ?? "wallet"}`);
    } catch (err) {
      store.disconnect();
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      if (
        msg.includes("not installed") ||
        msg.includes("not found") ||
        msg.includes("no wallets")
      ) {
        toast.error("Wallet not found — install the extension or pick another wallet.");
      } else if (
        msg.includes("reject") ||
        msg.includes("cancel") ||
        msg.includes("closed") ||
        msg.includes("denied")
      ) {
        // user dismissed the modal or rejected access — stay quiet-ish
        toast.info("Connection cancelled.");
      } else {
        toast.error("Could not connect wallet. Please try again.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch {
      /* ignore — clearing local state is enough */
    }
    store.disconnect();
    queryClient.removeQueries({
      predicate: (q) =>
        ["credit-score", "user-stats", "balance", "claimable"].includes(String(q.queryKey[0])),
    });
    toast.success("Wallet disconnected");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  return {
    address: store.address,
    walletName: store.walletName,
    isConnected: store.isConnected,
    connect,
    disconnect,
  };
}
