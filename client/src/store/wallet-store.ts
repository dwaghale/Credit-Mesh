"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WalletState {
  address: string | null;
  walletName: string | null;
  walletId: string | null;
  isConnected: boolean;
  setAddress: (address: string | null) => void;
  setWallet: (info: { address: string; name: string; id: string }) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      walletName: null,
      walletId: null,
      isConnected: false,
      setAddress: (address) => set({ address }),
      setWallet: ({ address, name, id }) =>
        set({ address, walletName: name, walletId: id, isConnected: true }),
      disconnect: () =>
        set({ address: null, walletName: null, walletId: null, isConnected: false }),
    }),
    {
      name: "creditmesh-wallet",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
