"use client";

import { useState } from "react";
import { ShieldCheck, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { usePoolBalance } from "@/hooks/use-contract-data";
import { useWallet } from "@/hooks/use-wallet";
import { useContractWrite } from "@/hooks/use-contract-write";
import { submitDepositPool } from "@/lib/contract";
import { stroopsToXlm, xlmToStroops } from "@/lib/format";

export function PoolCard() {
  const { data: pool, isLoading } = usePoolBalance();
  const { address, isConnected } = useWallet();
  const { execute, isPending } = useContractWrite();
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);

  const deposit = async () => {
    if (!address) return;
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
    const res = await execute("deposit_pool", () =>
      submitDepositPool({ depositor: address, amount: stroops }),
    );
    if (res) {
      setOpen(false);
      setAmount("");
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary size-4" /> Default-Insurance Pool
          </CardTitle>
        </div>
        <CardDescription>
          Backs lenders when borrowers default. Depositors share risk across the network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          {isLoading ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <p className="text-3xl font-bold tabular-nums">{stroopsToXlm(pool ?? 0)} XLM</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">Current pool coverage</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!isConnected}
              title={isConnected ? undefined : "Connect your wallet first"}
            >
              Deposit to Pool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit into insurance pool</DialogTitle>
              <DialogDescription>
                Funds are held by the contract and used to make lenders whole on defaults.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="pool-amount">Amount (XLM)</Label>
              <Input
                id="pool-amount"
                type="number"
                min="0"
                step="0.1"
                placeholder="100.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                <Info className="mt-0.5 size-3 shrink-0" />
                You will sign a testnet transaction moving XLM into the CreditMesh contract.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void deposit()} disabled={isPending || !amount}>
                {isPending && <Loader2 className="animate-spin" />}
                Confirm deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
