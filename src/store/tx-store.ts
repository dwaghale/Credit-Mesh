"use client";

import { create } from "zustand";

export type TxStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TxRecord {
  hash: string;
  method: string;
  status: TxStatus;
  createdAt: number;
  updatedAt: number;
}

export interface TxStore {
  transactions: TxRecord[];
  addPending: (hash: string, method: string) => void;
  updateStatus: (hash: string, status: TxStatus) => void;
}

export const useTxStore = create<TxStore>()((set) => ({
  transactions: [],
  addPending: (hash, method) =>
    set((s) => ({
      // newest first, cap at 50
      transactions: [
        { hash, method, status: "PENDING" as const, createdAt: Date.now(), updatedAt: Date.now() },
        ...s.transactions.filter((t) => t.hash !== hash),
      ].slice(0, 50),
    })),
  updateStatus: (hash, status) =>
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.hash === hash ? { ...t, status, updatedAt: Date.now() } : t,
      ),
    })),
}));
