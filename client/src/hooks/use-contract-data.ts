"use client";

import { useQuery } from "@tanstack/react-query";
import { getXlmBalance } from "@/lib/stellar";
import {
  fetchAllLoans,
  readClaimable,
  readCreditScore,
  readLoanContributions,
  readPoolBalance,
  readUserStats,
} from "@/lib/contract";

/** All loans with contributions — polled for near-realtime updates. */
export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: fetchAllLoans,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function usePoolBalance() {
  return useQuery({
    queryKey: ["pool-balance"],
    queryFn: () => readPoolBalance(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useCreditScore(address?: string | null) {
  return useQuery({
    queryKey: ["credit-score", address],
    queryFn: () => readCreditScore(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });
}

export function useUserStats(address?: string | null) {
  return useQuery({
    queryKey: ["user-stats", address],
    queryFn: () => readUserStats(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });
}

export function useXlmBalance(address?: string | null) {
  return useQuery({
    queryKey: ["balance", address],
    queryFn: () => getXlmBalance(address!),
    enabled: !!address,
    refetchInterval: 12_000,
  });
}

export function useClaimable(lender?: string | null, loanId?: number) {
  return useQuery({
    queryKey: ["claimable", lender, loanId],
    queryFn: () => readClaimable(lender!, loanId!),
    enabled: !!lender && typeof loanId === "number",
    refetchInterval: 15_000,
  });
}

export function useLoanContributions(loanId: number) {
  return useQuery({
    queryKey: ["contribs", loanId],
    queryFn: () => readLoanContributions(loanId),
    refetchInterval: 15_000,
  });
}
