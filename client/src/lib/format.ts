/** Stroops ↔ XLM helpers and misc formatting. */

export const STROOP = 10_000_000;

export function stroopsToXlm(stroops: number | string | bigint): string {
  let n: bigint;
  try {
    n = BigInt(stroops.toString());
  } catch {
    // Never crash the UI over a malformed on-chain value.
    return "0.00";
  }
  const neg = n < 0n;
  if (neg) n = -n;
  const whole = n / BigInt(STROOP);
  const frac = (n % BigInt(STROOP)).toString().padStart(7, "0").slice(0, 2);
  return `${neg ? "-" : ""}${whole.toLocaleString("en-US")}.${frac}`;
}

export function xlmToStroops(xlm: string | number): bigint {
  const s = typeof xlm === "number" ? xlm.toFixed(7) : xlm;
  const [whole = "0", frac = "0"] = s.split(".");
  return BigInt(whole) * BigInt(STROOP) + BigInt((frac || "0").padEnd(7, "0").slice(0, 7));
}

export function shortAddress(addr: string, size = 4): string {
  if (!addr || addr.length < size * 2 + 3) return addr;
  return `${addr.slice(0, size)}…${addr.slice(-size)}`;
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function formatDuration(secs: number): string {
  const days = Math.floor(secs / 86_400);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(secs / 3600);
  if (hours >= 1) return `${hours}h`;
  return `${Math.floor(secs / 60)}m`;
}

export function timeAgo(iso: string | number): string {
  const ts = typeof iso === "number" ? iso : Date.parse(iso);
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function countdown(secsLeft: number): string {
  if (secsLeft <= 0) return "past due";
  const d = Math.floor(secsLeft / 86_400);
  const h = Math.floor((secsLeft % 86_400) / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
