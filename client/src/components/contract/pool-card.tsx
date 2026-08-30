"use client";

import { useState } from "react";
import { ShieldCheck, Info, Loader2, Plus, ArrowRight } from "lucide-react";
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
import { usePoolBalance, useXlmBalance } from "@/hooks/use-contract-data";
import { useWallet } from "@/hooks/use-wallet";
import { useContractWrite } from "@/hooks/use-contract-write";
import { submitDepositPool } from "@/lib/contract";
import { stroopsToXlm, xlmToStroops } from "@/lib/format";

const QUICK_AMOUNTS = ["10", "50", "100", "500"];

export function PoolCard() {
  const { data: pool, isLoading } = usePoolBalance();
  const { address, isConnected, connect } = useWallet();
  const { execute, isPending } = useContractWrite();
  const balance = useXlmBalance(address);
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
    <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/70 to-card/90 backdrop-blur-md shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="bg-emerald-500/20 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="size-4" />
            </div>
            Default-Insurance Pool
          </CardTitle>
          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">
            Active Backstop
          </span>
        </div>
        <CardDescription className="text-xs">
          Community reserve that covers lender shortfalls when borrowers default past deadlines.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-card/80 border border-border/60 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Pool Liquidity</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-36 rounded-lg" />
            ) : (
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {stroopsToXlm(pool ?? 0)}{" "}
                <span className="text-sm font-semibold text-muted-foreground">XLM</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Status</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Solvency
            </span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          {isConnected ? (
            <DialogTrigger asChild>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all">
                <Plus className="size-4" /> Deposit into Pool
              </Button>
            </DialogTrigger>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void connect()}
            >
              Connect Wallet to Deposit
            </Button>
          )}

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                Deposit to Insurance Pool
              </DialogTitle>
              <DialogDescription className="text-xs">
                Funds are escrowed directly by the Soroban smart contract to protect the CreditMesh lending ecosystem.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="pool-amount">Amount (XLM)</Label>
                {balance.data && (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => setAmount(balance.data || "")}
                  >
                    Wallet: <span className="font-semibold">{balance.data} XLM</span>
                  </button>
                )}
              </div>

              <Input
                id="pool-amount"
                type="number"
                min="0"
                step="1"
                placeholder="100.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-base"
              />

              {/* Preset quick buttons */}
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(amt)}
                  >
                    +{amt} XLM
                  </Button>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-2.5 text-xs text-muted-foreground flex items-start gap-2 border border-border/40">
                <Info className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  You will sign a transaction on Stellar Testnet moving XLM into the CreditMesh contract pool.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void deposit()}
                disabled={isPending || !amount || Number(amount) <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" /> Confirming...
                  </>
                ) : (
                  <>
                    Confirm Deposit <ArrowRight className="size-4 ml-1.5" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
