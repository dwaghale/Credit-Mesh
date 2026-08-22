/**
 * Maps raw wallet / RPC / contract errors to friendly messages.
 */
export class WalletError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "WALLET_NOT_FOUND"
      | "USER_REJECTED"
      | "INSUFFICIENT_BALANCE"
      | "NETWORK"
      | "UNKNOWN" = "UNKNOWN",
  ) {
    super(message);
    this.name = "WalletError";
  }
}

const REJECTED_PATTERNS = [
  "reject",
  "declined",
  "denied",
  "cancelled",
  "canceled",
  "closed by user",
];

const INSUFFICIENT_PATTERNS = [
  "insufficient",
  "not enough",
  "balance too low",
];

export function friendlyError(err: unknown): string {
  if (err instanceof WalletError) return err.message;
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err ?? "unknown error");
  const lower = raw.toLowerCase();

  if (REJECTED_PATTERNS.some((p) => lower.includes(p))) {
    return "You rejected the request in your wallet. No transaction was sent.";
  }
  if (INSUFFICIENT_PATTERNS.some((p) => lower.includes(p))) {
    return "Insufficient XLM balance to complete this action.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Network issue — could not reach the Stellar testnet. Try again.";
  }

  // Contract errors surface from the RPC as "Error(Contract, #N)".
  const codeMatch = lower.match(/error\(contract, #(\d+)\)/);
  if (codeMatch) {
    const messages: Record<string, string> = {
      "1": "Not found on-chain (loan may not exist yet).",
      "2": "Contract is already initialized.",
      "3": "This loan is no longer open for funding.",
      "4": "Amount exceeds what this loan still needs.",
      "5": "This loan cannot be repaid right now (not active).",
      "6": "Only the borrower who created this loan can repay it.",
      "7": "Repayment exceeds the remaining amount due.",
      "8": "Loan is not active — default already processed?",
      "9": "This loan has not passed its deadline yet.",
      "10": "Nothing available to withdraw for this loan.",
    };
    const msg = messages[codeMatch[1]];
    if (msg) return msg;
  }
  if (lower.includes("wasmvm, invalidaction") || lower.includes("unreachablecodereached")) {
    return "The contract rejected this call — it may not be initialized or the inputs are invalid.";
  }

  // Fallbacks for error names (e.g. from local simulation output).
  if (lower.includes("alreadyinitialized")) {
    return "Contract is already initialized.";
  }
  if (lower.includes("notopenforfunding")) {
    return "This loan is no longer open for funding.";
  }
  if (lower.includes("overfund")) {
    return "Amount exceeds what this loan still needs.";
  }
  if (lower.includes("notrepayable")) {
    return "This loan cannot be repaid right now (not active).";
  }
  if (lower.includes("onlyborrower")) {
    return "Only the borrower who created this loan can repay it.";
  }
  if (lower.includes("exceedsamountdue")) {
    return "Repayment exceeds the remaining amount due.";
  }
  if (lower.includes("notactive")) {
    return "Loan is not active — default already processed?";
  }
  if (lower.includes("notdefaultedyet")) {
    return "This loan has not passed its deadline yet.";
  }
  if (lower.includes("nothingtowithdraw")) {
    return "Nothing available to withdraw for this loan.";
  }

  // Trim verbose host errors down to something readable.
  const firstLine = raw.split("\n")[0]?.slice(0, 180);
  return firstLine || "Something went wrong. Please try again.";
}
