"use client";

import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { CONTRACT_ID } from "@/config";
import { server } from "@/lib/stellar";

/** One decoded CreditMesh contract event, ready for the activity feed. */
export interface AppEvent {
  id: string; // unique event id (paging token)
  type: string; // loan_req | funded | repaid | default | pool_dep | withdrew
  actor: string; // primary wallet address involved
  action: string; // humanized description
  amount?: string; // formatted XLM if applicable
  loanId?: number;
  timestamp: string; // ISO
  txHash: string;
}

const TYPE_LABELS: Record<string, (data: unknown[]) => { actor: string; action: string; amount?: string; loanId?: number }> = {
  loan_req: (d) => ({
    actor: String(d[0] ?? ""),
    action: `requested a loan of ${(Number(d[2]) / 1e7).toFixed(0)} XLM`,
    amount: d[2] ? (Number(d[2]) / 1e7).toFixed(2) : undefined,
    loanId: Number(d[1] ?? -1),
  }),
  funded: (d) => ({
    actor: String(d[0] ?? ""),
    action: `funded loan #${d[1]}`,
    amount: d[2] ? (Number(d[2]) / 1e7).toFixed(2) : undefined,
    loanId: Number(d[1] ?? -1),
  }),
  repaid: (d) => ({
    actor: String(d[0] ?? ""),
    action: `fully repaid loan #${d[1]}`,
    amount: d[2] ? (Number(d[2]) / 1e7).toFixed(2) : undefined,
    loanId: Number(d[1] ?? -1),
  }),
  default: (d) => ({
    actor: String(d[1] ?? ""),
    action: `defaulted on loan #${d[0]} — pool covered ${(Number(d[3]) / 1e7).toFixed(2)} XLM`,
    amount: d[3] ? (Number(d[3]) / 1e7).toFixed(2) : undefined,
    loanId: Number(d[0] ?? -1),
  }),
  pool_dep: (d) => ({
    actor: String(d[0] ?? ""),
    action: "deposited into the insurance pool",
    amount: d[1] ? (Number(d[1]) / 1e7).toFixed(2) : undefined,
  }),
  withdrew: (d) => ({
    actor: String(d[0] ?? ""),
    action: `withdrew payout from loan #${d[1]}`,
    amount: d[2] ? (Number(d[2]) / 1e7).toFixed(2) : undefined,
    loanId: Number(d[1] ?? -1),
  }),
};

function decodeEvent(e: rpc.Api.EventResponse): AppEvent | null {
  try {
    const topics = e.topic as xdr.ScVal[];
    const typeSym = topics.length > 0 ? String(scValToNative(topics[0])) : "";
    const dataRaw = scValToNative(e.value as xdr.ScVal);
    const data = Array.isArray(dataRaw) ? dataRaw : [dataRaw];
    const mapper = TYPE_LABELS[typeSym];
    if (!mapper) return null;
    const { actor, action, amount, loanId } = mapper(data);
    return {
      id: e.id,
      type: typeSym,
      actor,
      action,
      amount,
      loanId,
      timestamp: e.ledgerClosedAt,
      txHash: e.txHash,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch recent contract events.
 * @param cursor optional paging cursor — pass the id of the newest event you have
 *               to receive only newer events (used for live polling).
 */
export async function fetchEvents(cursor?: string): Promise<AppEvent[]> {
  let request: rpc.Api.GetEventsRequest;
  if (cursor) {
    request = {
      cursor,
      filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
      limit: 100,
    };
  } else {
    const latest = await server().getLatestLedger();
    // window: ~24h of testnet ledgers (5s each), bounded for RPC friendliness
    const startLedger = Math.max(1, latest.sequence - 17_280);
    request = {
      startLedger,
      filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
      limit: 100,
    };
  }
  const res = await server().getEvents(request);
  return res.events
    .map(decodeEvent)
    .filter((e): e is AppEvent => e !== null)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
