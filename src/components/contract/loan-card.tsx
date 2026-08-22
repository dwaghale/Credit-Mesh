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
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { useClaimable } from "@/hooks/use-contract-data";
import { submitFundLoan, submitRepayLoan, submitWithdraw, submitMarkDefault } from "@/lib/contract";
import { bpsToPercent, countdown, shortAddress, stroopsToXlm, xlmToStroops } from "@/lib/format";

const STATUS_META = {
  Pending: { variant: "warning" as const, icon: Hourglass, text: "Seeking funding" },
  Active: { variant: "default" as const, icon: Timer, text: "Active" },
  Repaid: { variant: "success" as const, icon: CircleCheck, text: "Repaid" },
  Defaulted: { variant: "destructive" as const, icon: ShieldAlert, text: "Defaulted" },
};

export function LoanCard({ loan, now }: { loan: LoanWithContribs; now: number }) {
  const { address, isConnected } = useWallet();
  const { execute, isPending } = useContractWrite();
  const meta = STATUS_META[loan.status.tag];

  const principal = BigInt(loan.principal);
  const funded = BigInt(loan.funded);
  const repaid = BigInt(loan.repaid);
  const interest = (principal * BigInt(loan.apr_bps)) / 10_000n;
  const totalDue = principal + interest;
  const remainingDue = totalDue > repaid ? totalDue - repaid : 0n;

  const fundedPct = principal === 0n ? 0 : Number((funded * 100n) / principal);
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
    <Card className="gap-3">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Loan #{loan.id}</span>
            <Badge variant={meta.variant}>
              <meta.icon className="size-3" /> {meta.text}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            by {shortAddress(loan.borrower, 6)}
            {isBorrower && " (you)"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{stroopsToXlm(principal)}</p>
          <p className="text-muted-foreground text-xs">XLM @ {bpsToPercent(loan.apr_bps)} APR</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              Funded {stroopsToXlm(funded)} / {stroopsToXlm(principal)}
            </span>
            <span>{fundedPct}%</span>
          </div>
          <Progress value={fundedPct} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
          <Field label="Total due" value={`${stroopsToXlm(totalDue)} XLM`} />
          <Field label="Repaid" value={`${stroopsToXlm(repaid)} XLM`} />
          <Field
            label={deadlinePassed && loan.status.tag === "Active" ? "Deadline passed" : "Deadline"}
            value={
              loan.status.tag === "Pending"
                ? "—"
                : loan.deadline === 0
                  ? "—"
                  : new Date(loan.deadline * 1000).toLocaleDateString() +
                    (loan.status.tag === "Active"
                      ? ` · ${countdown(loan.deadline - now)}`
                      : "")
              }
            warn={deadlinePassed && loan.status.tag === "Active"}
          />
        </div>

        {Object.keys(loan.contributions).length > 0 && (
          <div className="bg-muted/40 rounded-md p-2.5 text-xs">
            <p className="text-muted-foreground mb-1">Lenders</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(loan.contributions)
                .sort((a, b) => (BigInt(b[1]) > BigInt(a[1]) ? 1 : -1))
                .map(([addr, amt]) => (
                  <Badge key={addr} variant="secondary" className="font-mono">
                    {shortAddress(addr, 3)}: {stroopsToXlm(amt)} XLM
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
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
            <Button size="sm" onClick={() => void withdraw()} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <HandCoins />}
              Withdraw {stroopsToXlm(claimable.data ?? 0n)} XLM
            </Button>
          )}

          {isConnected &&
            loan.status.tag === "Active" &&
            deadlinePassed &&
            remainingDue > 0n && (
              <Button size="sm" variant="outline" onClick={() => void markDefault()} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
                Trigger default
              </Button>
            )}

          {!isConnected && (loan.status.tag === "Pending" || loan.status.tag === "Active") && (
            <p className="text-muted-foreground text-xs">Connect a wallet to interact</p>
          )}

          {claimable.isFetched && !hasClaim &&
            (loan.status.tag === "Repaid" || loan.status.tag === "Defaulted") && (
              <Clock4 className="text-muted-foreground size-4" />
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={`font-medium tabular-nums ${warn ? "text-destructive" : ""}`}>{value}</p>
    </div>
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

  const submit = async () => {
    if (await onSubmit(amount)) {
      setOpen(false);
      setAmount("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <HandCoins /> Fund this loan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund loan</DialogTitle>
          <DialogDescription>
            Up to {stroopsToXlm(remaining)} XLM still needed. Funds sit in escrow until the loan
            is fully funded, then go to the borrower.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="fund-amount">Amount (XLM)</Label>
          <Input
            id="fund-amount"
            type="number"
            min="0"
            step="1"
            placeholder={stroopsToXlm(remaining)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!amount}>
            Confirm
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
  const display = useMemo(() => stroopsToXlm(remaining), [remaining]);

  const submit = async () => {
    if (await onSubmit(amount)) {
      setOpen(false);
      setAmount("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <CircleCheck /> Repay
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repay loan</DialogTitle>
          <DialogDescription>
            {late
              ? "This loan is past its deadline — repayment will count as LATE on your credit score."
              : "On-time repayments raise your on-chain credit score."}{" "}
            Remaining due: <strong>{display} XLM</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="repay-amount">Amount (XLM)</Label>
          <Input
            id="repay-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder={display}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAmount(display.replace(/,/g, ""))}
          >
            Pay full remaining ({display} XLM)
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!amount}>
            Confirm repayment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
