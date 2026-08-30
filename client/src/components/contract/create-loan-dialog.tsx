"use client";

import { useState } from "react";
import { Plus, Loader2, Calculator, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@/hooks/use-wallet";
import { useContractWrite } from "@/hooks/use-contract-write";
import { submitRequestLoan } from "@/lib/contract";
import { xlmToStroops } from "@/lib/format";

const TERMS = [
  { label: "7 days", value: 7 * 86_400 },
  { label: "14 days", value: 14 * 86_400 },
  { label: "30 days", value: 30 * 86_400 },
  { label: "90 days", value: 90 * 86_400 },
];

const PRESET_AMOUNTS = ["100", "500", "1000", "5000"];

export function CreateLoanDialog() {
  const { isConnected, connect } = useWallet();
  const { execute, isPending } = useContractWrite();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [termSecs, setTermSecs] = useState(30 * 86_400);
  const [aprBps, setAprBps] = useState(1200);

  const numAmount = parseFloat(amount) || 0;
  const aprPct = aprBps / 100;
  const interestXlm = (numAmount * aprBps) / 10_000;
  const totalRepayment = numAmount + interestXlm;

  const submit = async () => {
    let stroops: bigint;
    try {
      stroops = xlmToStroops(amount);
    } catch {
      toast.error("Enter a valid XLM amount");
      return;
    }
    if (stroops <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (aprBps <= 0 || aprBps > 10_000) {
      toast.error("APR must be between 0.01% and 100%");
      return;
    }
    const res = await execute("request_loan", () =>
      submitRequestLoan({ amount: stroops, term_secs: termSecs, apr_bps: aprBps }),
    );
    if (res) {
      setOpen(false);
      setAmount("");
      setAprBps(1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isConnected ? (
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="size-4" /> Request a Loan
          </Button>
        </DialogTrigger>
      ) : (
        <Button variant="default" onClick={() => void connect()}>
          <Plus className="size-4" /> Connect to Request Loan
        </Button>
      )}

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
              <Sparkles className="size-5" />
            </div>
            Create Loan Request
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lenders on the CreditMesh network will co-fund your request into escrow. Once 100% funded, XLM is automatically disbursed to your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Amount input & presets */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="loan-amount" className="text-xs font-semibold">
                Principal Amount (XLM)
              </Label>
              <span className="text-[11px] text-muted-foreground">Testnet XLM</span>
            </div>
            <Input
              id="loan-amount"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base font-semibold"
            />
            <div className="flex gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs py-1 h-7"
                  onClick={() => setAmount(val)}
                >
                  {val} XLM
                </Button>
              ))}
            </div>
          </div>

          {/* Term selector */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Loan Duration / Term</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TERMS.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={termSecs === t.value ? "default" : "outline"}
                  onClick={() => setTermSecs(t.value)}
                  className="text-xs"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* APR Slider */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="loan-apr" className="text-xs font-semibold">
                Offered APR: <span className="text-primary font-bold">{aprPct.toFixed(1)}%</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Higher APR attracts lenders faster
              </span>
            </div>
            <input
              id="loan-apr"
              type="range"
              min={100}
              max={10000}
              step={50}
              value={aprBps}
              onChange={(e) => setAprBps(Number(e.target.value))}
              className="accent-primary w-full cursor-pointer h-2 bg-muted rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>1.0% (Min)</span>
              <span>12.0% (Avg)</span>
              <span>50.0%</span>
              <span>100.0% (Max)</span>
            </div>
          </div>

          {/* Live Loan Calculation Summary */}
          <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Calculator className="size-3.5 text-primary" /> Loan Repayment Calculator
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">Borrowing</p>
                <p className="font-bold text-xs sm:text-sm text-foreground tabular-nums">
                  {numAmount.toLocaleString()} XLM
                </p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">Interest ({aprPct}%)</p>
                <p className="font-bold text-xs sm:text-sm text-amber-500 tabular-nums">
                  +{interestXlm.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
                </p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
                <p className="text-[10px] text-primary font-medium">Total Due</p>
                <p className="font-extrabold text-xs sm:text-sm text-primary tabular-nums">
                  {totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={isPending || !amount || numAmount <= 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" /> Submitting Request...
              </>
            ) : (
              <>
                Publish Loan Request <ArrowRight className="size-4 ml-1.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
