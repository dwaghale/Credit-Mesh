"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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

export function CreateLoanDialog() {
  const { isConnected } = useWallet();
  const { execute, isPending } = useContractWrite();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [termSecs, setTermSecs] = useState(30 * 86_400);
  const [aprBps, setAprBps] = useState(1200);

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
      <DialogTrigger asChild>
        <Button disabled={!isConnected} title={isConnected ? undefined : "Connect your wallet first"}>
          <Plus /> Request a Loan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New loan request</DialogTitle>
          <DialogDescription>
            Lenders on CreditMesh can now co-fund your loan until it reaches the full amount.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="loan-amount">Principal (XLM)</Label>
            <Input
              id="loan-amount"
              type="number"
              min="0"
              step="1"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Term</Label>
            <div className="grid grid-cols-4 gap-2">
              {TERMS.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={termSecs === t.value ? "default" : "outline"}
                  onClick={() => setTermSecs(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="loan-apr">APR: {(aprBps / 100).toFixed(1)}%</Label>
            <input
              id="loan-apr"
              type="range"
              min={100}
              max={10000}
              step={50}
              value={aprBps}
              onChange={(e) => setAprBps(Number(e.target.value))}
              className="accent-primary w-full cursor-pointer"
            />
            <p className="text-muted-foreground text-xs">
              Total repayment = principal + interest ({(aprBps / 100).toFixed(1)}% of principal).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isPending || !amount}>
            {isPending && <Loader2 className="animate-spin" />}
            Create request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
