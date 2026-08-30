"use client";

import { useMemo, useState } from "react";
import {
  HandCoins,
  Loader2,
  ShieldAlert,
  Timer,
  CircleCheck,
  Clock4,
  Hourglass,
  ExternalLink,
  Users,
  Coins,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LoanWithContribs } from "@/lib/contract";
import { useWallet } from "@/hooks/use-wallet";
import { useContractWrite } from "@/hooks/use-contract-write";
import { useClaimable, useXlmBalance } from "@/hooks/use-contract-data";
import { submitFundLoan, submitRepayLoan, submitWithdraw, submitMarkDefault } from "@/lib/contract";
import { bpsToPercent, countdown, shortAddress, stroopsToXlm, xlmToStroops } from "@/lib/format";
import { explorerAccountUrl } from "@/config";
import { cn } from "@/lib/utils";

const STATUS_META = {
  Pending: {
    variant: "warning" as const,
    icon: Hourglass,
    text: "Seeking Funding",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  Active: {
    variant: "default" as const,
    icon: Timer,
    text: "Active & Repaying",
    badgeClass: "bg-primary/10 text-primary border-primary/30",
  },
  Repaid: {
    variant: "success" as const,
    icon: CircleCheck,
    text: "Fully Repaid",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  Defaulted: {
    variant: "destructive" as const,
    icon: ShieldAlert,
    text: "Defaulted",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
};

export function LoanCard({ loan, now }: { loan: LoanWithContribs; now: number }) {
  const { address, isConnected, connect } = useWallet();
  const { execute, isPending } = useContractWrite();
  const meta = STATUS_META[loan.status.tag];

  const principal = BigInt(loan.principal);
  const funded = BigInt(loan.funded);
  const repaid = BigInt(loan.repaid);
  const interest = (principal * BigInt(loan.apr_bps)) / 10_000n;
  const totalDue = principal + interest;
  const remainingDue = totalDue > repaid ? totalDue - repaid : 0n;

  const fundedPct = principal === 0n ? 0 : Math.min(100, Number((funded * 100n) / principal));
  const isBorrower = !!address && address.toLowerCase() === loan.borrower.toLowerCase();
  const claimable = useClaimable(
    isConnected && (loan.status.tag === "Repaid" || loan.status.tag === "Defaulted")
      ? address
      : null,
    loan.id,
  );
  const hasClaim = (claimable.data ?? 0n) > 0n;
  const deadlinePassed = now > loan.deadline && loan.deadline > 0;

  /* ---------------- actions ---------------- */

  const fund = async (amountXlm: string) => {
    let stroops: bigint;
    try {
      stroops = xlmToStroops(amountXlm);
    } catch {
      toast.error("Enter a valid amount");
      return false;
    }
    if (stroops <= 0 || stroops > principal - funded) {
      toast.error(`Amount must be between 0 and ${stroopsToXlm(principal - funded)} XLM`);
      return false;
    }
    const res = await execute("fund_loan", () =>
      submitFundLoan({ loanId: loan.id, amount: stroops, lender: address! }),
    );
    return !!res;
  };

  const repay = async (amountXlm: string) => {
    let stroops: bigint;
    try {
      stroops = xlmToStroops(amountXlm);
    } catch {
      toast.error("Enter a valid amount");
      return false;
    }
    if (stroops <= 0 || stroops > remainingDue) {
      toast.error(`Repayment must be between 0 and ${stroopsToXlm(remainingDue)} XLM`);
      return false;
    }
    const res = await execute("repay", () =>
      submitRepayLoan({ loanId: loan.id, amount: stroops, borrower: address! }),
    );
    return !!res;
  };

  const withdraw = async () => {
    await execute("withdraw", () => submitWithdraw({ loanId: loan.id, lender: address! }));
  };

  const markDefault = async () => {
    await execute("mark_default", () => submitMarkDefault({ loanId: loan.id }));
  };

  return (
    <Card className="group relative overflow-hidden border border-border/80 bg-card/70 backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-md gap-4 py-5">
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 px-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight">Loan #{loan.id}</span>
            <Badge className={cn("px-2.5 py-0.5 text-xs font-semibold border", meta.badgeClass)}>
              <meta.icon className="size-3 mr-1 inline" /> {meta.text}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-xs flex items-center gap-1.5">
            Borrower:
            <a
              href={explorerAccountUrl(loan.borrower)}
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {shortAddress(loan.borrower, 5)}
              <ExternalLink className="size-2.5 opacity-60" />
            </a>
            {isBorrower && (
              <span className="bg-primary/20 text-primary rounded px-1 text-[10px] font-semibold">
                YOU
              </span>
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">
            {stroopsToXlm(principal)}{" "}
            <span className="text-xs font-medium text-muted-foreground">XLM</span>
          </p>
          <p className="text-primary font-semibold text-xs">{bpsToPercent(loan.apr_bps)} APR</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pt-0">
        {/* Progress Bar & percentage */}
        <div className="space-y-1.5 bg-muted/30 rounded-xl p-3 border border-border/40">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Coins className="size-3.5 text-primary" />
              Funded: <strong className="text-foreground font-semibold">{stroopsToXlm(funded)}</strong> / {stroopsToXlm(principal)} XLM
            </span>
            <span className="font-bold font-mono text-primary">{fundedPct}%</span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                loan.status.tag === "Pending"
                  ? "bg-gradient-to-r from-primary to-indigo-500"
                  : loan.status.tag === "Active"
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                    : loan.status.tag === "Repaid"
                      ? "bg-emerald-500"
                      : "bg-rose-500",
              )}
              style={{ width: `${Math.max(2, fundedPct)}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-muted-foreground text-[11px]">Total Due (with APR)</p>
            <p className="font-bold text-sm text-foreground tabular-nums">
              {stroopsToXlm(totalDue)} XLM
            </p>
          </div>

          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-muted-foreground text-[11px]">Repaid So Far</p>
            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stroopsToXlm(repaid)} XLM
            </p>
          </div>

          <div className={cn("rounded-lg p-2.5 col-span-2 sm:col-span-1", deadlinePassed && loan.status.tag === "Active" ? "bg-rose-500/10 border border-rose-500/30" : "bg-muted/40")}>
            <p className="text-muted-foreground text-[11px]">
              {deadlinePassed && loan.status.tag === "Active" ? "⚠️ Repayment Overdue" : "Repayment Deadline"}
            </p>
            <p className={cn("font-bold text-xs sm:text-sm tabular-nums", deadlinePassed && loan.status.tag === "Active" ? "text-rose-500" : "text-foreground")}>
              {loan.status.tag === "Pending"
                ? "Starts upon 100% funding"
                : loan.deadline === 0
                  ? "—"
                  : `${new Date(loan.deadline * 1000).toLocaleDateString()}${loan.status.tag === "Active" ? ` (${countdown(loan.deadline - now)})` : ""}`}
            </p>
          </div>
        </div>

        {/* Lenders List */}
        {Object.keys(loan.contributions).length > 0 && (
          <div className="bg-card/50 rounded-xl p-3 text-xs border border-border/60">
            <p className="text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
              <Users className="size-3 text-primary" /> Contributing Lenders ({Object.keys(loan.contributions).length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(loan.contributions)
                .sort((a, b) => (BigInt(b[1]) > BigInt(a[1]) ? 1 : -1))
                .map(([addr, amt]) => (
                  <Badge key={addr} variant="secondary" className="font-mono text-[11px] py-0.5 px-2">
                    {shortAddress(addr, 3)}: <span className="font-bold ml-1">{stroopsToXlm(amt)} XLM</span>
                    {address && addr.toLowerCase() === address.toLowerCase() && (
                      <span className="ml-1 text-primary font-bold">(You)</span>
                    )}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {isConnected && loan.status.tag === "Pending" && (
              <FundDialog
                remaining={principal - funded}
                disabled={isPending}
                onSubmit={fund}
              />
            )}

            {isConnected && isBorrower && loan.status.tag === "Active" && (
              <RepayDialog
                remaining={remainingDue}
                disabled={isPending}
                late={deadlinePassed}
                onSubmit={repay}
              />
            )}

            {isConnected && hasClaim && (
              <Button
                size="sm"
                onClick={() => void withdraw()}
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isPending ? <Loader2 className="animate-spin" /> : <HandCoins />}
                Withdraw {stroopsToXlm(claimable.data ?? 0n)} XLM Payout
              </Button>
            )}

            {isConnected &&
              loan.status.tag === "Active" &&
              deadlinePassed &&
              remainingDue > 0n && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void markDefault()}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
                  Trigger Default (Cover via Pool)
                </Button>
              )}

            {!isConnected && (loan.status.tag === "Pending" || loan.status.tag === "Active") && (
              <Button size="sm" variant="outline" onClick={() => void connect()}>
                Connect Wallet to Act
              </Button>
            )}
          </div>

          {claimable.isFetched && !hasClaim &&
            (loan.status.tag === "Repaid" || loan.status.tag === "Defaulted") && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Clock4 className="size-3.5" /> No pending withdrawal
              </span>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function FundDialog({
  remaining,
  disabled,
  onSubmit,
}: {
  remaining: bigint;
  disabled: boolean;
  onSubmit: (amount: string) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { address } = useWallet();
  const balance = useXlmBalance(address);

  const remainingXlm = parseFloat(stroopsToXlm(remaining).replace(/,/g, "")) || 0;

  const setPct = (pct: number) => {
    const val = Math.floor((remainingXlm * pct) * 100) / 100;
    setAmount(val.toString());
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (await onSubmit(amount)) {
        setOpen(false);
        setAmount("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs">
          <HandCoins className="size-3.5" /> Fund Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-primary" /> Co-Fund This Loan
          </DialogTitle>
          <DialogDescription className="text-xs">
            Contribute capital to this loan request. Funds remain in smart contract escrow until fully funded.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="fund-amount" className="font-medium">Amount to Escrow (XLM)</Label>
            <span className="text-muted-foreground">
              Needs: <strong className="text-primary">{stroopsToXlm(remaining)} XLM</strong>
            </span>
          </div>

          <Input
            id="fund-amount"
            type="number"
            min="1"
            step="1"
            placeholder={stroopsToXlm(remaining).replace(/,/g, "")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-base font-semibold"
          />

          {/* Quick percentage buttons */}
          <div className="flex gap-2">
            {[
              { label: "25%", pct: 0.25 },
              { label: "50%", pct: 0.5 },
              { label: "75%", pct: 0.75 },
              { label: "100% (Max)", pct: 1.0 },
            ].map(({ label, pct }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs py-1 h-7"
                onClick={() => setPct(pct)}
              >
                {label}
              </Button>
            ))}
          </div>

          {balance.data && (
            <p className="text-[11px] text-muted-foreground">
              Available in wallet: <span className="font-semibold text-foreground">{balance.data} XLM</span>
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={submitting || !amount || Number(amount) <= 0}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-1.5" /> Confirming...
              </>
            ) : (
              <>
                Confirm Funding <ArrowRight className="size-4 ml-1.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RepayDialog({
  remaining,
  disabled,
  late,
  onSubmit,
}: {
  remaining: bigint;
  disabled: boolean;
  late: boolean;
  onSubmit: (amount: string) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const display = useMemo(() => stroopsToXlm(remaining), [remaining]);
  const rawRemaining = parseFloat(display.replace(/,/g, "")) || 0;

  const setPct = (pct: number) => {
    const val = Math.floor((rawRemaining * pct) * 100) / 100;
    setAmount(val.toString());
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (await onSubmit(amount)) {
        setOpen(false);
        setAmount("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs">
          <CircleCheck className="size-3.5" /> Repay Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheck className="size-5 text-emerald-500" /> Repay Loan Balance
          </DialogTitle>
          <DialogDescription className="text-xs">
            {late ? (
              <span className="text-amber-500 font-medium flex items-center gap-1">
                <AlertTriangle className="size-3.5" /> Overdue deadline: counts as LATE repayment on credit score.
              </span>
            ) : (
              <span className="text-emerald-500 font-medium">
                On-time repayment will increase your on-chain credit score by +100 points!
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="repay-amount">Repayment Amount (XLM)</Label>
            <span className="text-muted-foreground">
              Total remaining: <strong className="text-foreground">{display} XLM</strong>
            </span>
          </div>

          <Input
            id="repay-amount"
            type="number"
            min="0"
            step="0.1"
            placeholder={display.replace(/,/g, "")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-base font-semibold"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setPct(0.25)}
            >
              25%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setPct(0.5)}
            >
              50%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              onClick={() => setAmount(display.replace(/,/g, ""))}
            >
              Full Repay ({display} XLM)
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={submitting || !amount || Number(amount) <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-1.5" /> Confirming...
              </>
            ) : (
              <>
                Confirm Repayment <ArrowRight className="size-4 ml-1.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
