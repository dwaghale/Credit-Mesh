"use client";

import { Client } from "contract";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { NETWORK_PASSPHRASE, RPC_URL, CONTRACT_ID } from "@/config";
import { friendlyError, WalletError } from "@/lib/errors";

type KitLike = {
  getAddress: () => Promise<{ address: string }>;
  signTransaction: (
    xdr: string,
    opts: { address?: string; networkPassphrase?: string },
  ) => Promise<{ signedTxXdr: string }>;
};

let _kit: KitLike | null = null;

/** Register the wallet kit instance used for signing (called once on mount). */
export function setSigningKit(kit: KitLike) {
  _kit = kit;
}

export function contractClient(publicKey?: string) {
  return new Client({
    contractId: CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    ...(publicKey && _kit
      ? {
          publicKey,
          signTransaction: async (xdr: string) => {
            if (!_kit) throw new WalletError("Wallet not connected", "WALLET_NOT_FOUND");
            const { address } = await _kit.getAddress();
            const { signedTxXdr } = await _kit.signTransaction(xdr, {
              address,
              networkPassphrase: NETWORK_PASSPHRASE,
            });
            return { signedTxXdr };
          },
        }
      : {}),
  });
}

/* ------------------------------------------------------------------ */
/* READS                                                               */
/* ------------------------------------------------------------------ */

export async function readLoansCount(): Promise<number> {
  const tx = await contractClient().loans_count();
  return Number(tx.result);
}

export async function readPoolBalance(): Promise<string> {
  const tx = await contractClient().pool_balance();
  return tx.result.toString();
}

export async function readLoan(loanId: number) {
  const tx = await contractClient().get_loan({ loan_id: BigInt(loanId) });
  return tx.result;
}

export async function readLoanContributions(loanId: number) {
  const tx = await contractClient().loan_contributions({ loan_id: BigInt(loanId) });
  return tx.result; // Map<string, i128>
}

export async function readClaimable(lender: string, loanId: number): Promise<bigint> {
  const tx = await contractClient().claimable({
    lender,
    loan_id: BigInt(loanId),
  });
  return tx.result;
}

export async function readCreditScore(user: string): Promise<number> {
  const tx = await contractClient().credit_score({ user });
  return Number(tx.result);
}

export async function readUserStats(user: string) {
  const tx = await contractClient().user_stats({ user });
  return tx.result;
}

/** Fetch every loan (0..count-1) with its contributions. */
export async function fetchAllLoans(): Promise<LoanWithContribs[]> {
  const count = await readLoansCount();
  const ids = Array.from({ length: count }, (_, i) => i);
  const [loans, contribs] = await Promise.all([
    Promise.all(ids.map((id) => readLoan(id))),
    Promise.all(ids.map((id) => readLoanContributions(id).catch(() => ({})))),
  ]);
  return loans.map((loan, i) => ({
    ...loan,
    id: Number(loan.id),
    principal: loan.principal.toString(),
    funded: loan.funded.toString(),
    repaid: loan.repaid.toString(),
    deadline: Number(loan.deadline),
    createdAt: Number(loan.created_at),
    term_secs: Number(loan.term_secs),
    contributions: toRecord(contribs[i]),
  }));
}

export interface LoanWithContribs {
  id: number;
  borrower: string;
  principal: string;
  funded: string;
  repaid: string;
  apr_bps: number;
  term_secs: number;
  createdAt: number;
  deadline: number;
  status: { tag: "Pending" | "Active" | "Repaid" | "Defaulted"; values: void };
  contributions: Record<string, string>;
}

/** Normalize SDK map/object output into a plain record of strings. */
function toRecord(m: unknown): Record<string, string> {
  if (m instanceof Map) {
    return Object.fromEntries([...(m as Map<string, bigint>).entries()].map(([k, v]) => [k, v.toString()]));
  }
  // The SDK may decode an ScMap as an array of [key, value] entries.
  if (Array.isArray(m)) {
    return Object.fromEntries(
      m
        .filter((e): e is [unknown, unknown] => Array.isArray(e) && e.length === 2)
        .map(([k, v]) => [String(k), String(v)]),
    );
  }
  if (m && typeof m === "object") {
    return Object.fromEntries(
      Object.entries(m as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
  }
  return {};
}

/* ------------------------------------------------------------------ */
/* WRITES                                                              */
/* ------------------------------------------------------------------ */

export interface WriteResult {
  hash?: string;
  result?: unknown;
}

async function signAndSend<T>(
  call: (c: Client) => Promise<AssembledTransaction<T>>,
): Promise<WriteResult> {
  if (!_kit) throw new WalletError("Connect a wallet first", "WALLET_NOT_FOUND");
  const { address } = await _kit.getAddress();
  if (!address) throw new WalletError("Wallet not connected", "WALLET_NOT_FOUND");

  try {
    const c = contractClient(address);
    const assembled = await call(c);
    const sent = await assembled.signAndSend();
    if (sent.sendTransactionResponse?.status === "ERROR") {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(sent.sendTransactionResponse.errorResult ?? "")}`);
    }
    return { hash: sent.sendTransactionResponse?.hash, result: sent.result };
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export function submitRequestLoan(args: { amount: bigint; term_secs: number; apr_bps: number }) {
  return signAndSend((c) =>
    c.request_loan({
      borrower: c.options.publicKey!,
      amount: args.amount,
      term_secs: BigInt(args.term_secs),
      apr_bps: args.apr_bps,
    }),
  );
}

export function submitFundLoan(args: { loanId: number; amount: bigint; lender: string }) {
  return signAndSend((c) =>
    c.fund_loan({ lender: args.lender, loan_id: BigInt(args.loanId), amount: args.amount }),
  );
}

export function submitRepayLoan(args: { loanId: number; amount: bigint; borrower: string }) {
  return signAndSend((c) =>
    c.repay({ borrower: args.borrower, loan_id: BigInt(args.loanId), amount: args.amount }),
  );
}

export function submitWithdraw(args: { loanId: number; lender: string }) {
  return signAndSend((c) => c.withdraw({ lender: args.lender, loan_id: BigInt(args.loanId) }));
}

export function submitDepositPool(args: { amount: bigint; depositor: string }) {
  return signAndSend((c) => c.deposit_pool({ depositor: args.depositor, amount: args.amount }));
}

export function submitMarkDefault(args: { loanId: number }) {
  return signAndSend((c) => c.mark_default({ loan_id: BigInt(args.loanId) }));
}
