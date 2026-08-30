"use client";

import { Loader2, CircleCheck, XCircle, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTxStore } from "@/store/tx-store";
import { shortAddress, timeAgo } from "@/lib/format";
import { explorerTxUrl } from "@/config";
import { cn } from "@/lib/utils";

const STATUS_META = {
  PENDING: {
    icon: Loader2,
    badge: (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">
        Pending Confirmation
      </Badge>
    ),
    spin: true,
  },
  SUCCESS: {
    icon: CircleCheck,
    badge: (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
        Confirmed on Soroban
      </Badge>
    ),
    spin: false,
  },
  FAILED: {
    icon: XCircle,
    badge: (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-semibold">
        Transaction Failed
      </Badge>
    ),
    spin: false,
  },
} as const;

export function TransactionHistory() {
  const transactions = useTxStore((s) => s.transactions);

  const copyHash = (hash: string) => {
    void navigator.clipboard.writeText(hash);
    toast.success("Transaction hash copied");
  };

  if (transactions.length === 0) {
    return (
      <div className="border border-dashed border-border/80 bg-card/30 rounded-xl px-6 py-12 text-center flex flex-col items-center justify-center">
        <div className="bg-muted/60 p-3 rounded-full mb-3 text-muted-foreground">
          <ShieldCheck className="size-6" />
        </div>
        <p className="font-semibold text-sm text-foreground">No transactions recorded yet</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
          Transactions you sign through CreditMesh appear here with live on-chain status and Stellar Expert explorer links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {transactions.map((tx) => {
        const meta = STATUS_META[tx.status];
        const Icon = meta.icon;
        return (
          <Card
            key={tx.hash}
            className="group relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md py-3 transition-all hover:border-primary/40"
          >
            <CardContent className="flex items-center gap-3 px-4 pt-0">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                  tx.status === "SUCCESS"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : tx.status === "FAILED"
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                )}
              >
                <Icon className={cn("size-4", meta.spin && "animate-spin")} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{tx.method}</span>
                  {meta.badge}
                </div>
                <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                  {shortAddress(tx.hash, 8)} ·{" "}
                  <span className="text-foreground/70 font-sans">
                    {timeAgo(tx.status === "PENDING" ? tx.createdAt : tx.updatedAt)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg opacity-60 hover:opacity-100"
                  onClick={() => copyHash(tx.hash)}
                  title="Copy hash"
                >
                  <Copy className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-xs h-7 px-2.5 text-primary hover:bg-primary/10"
                >
                  <a href={explorerTxUrl(tx.hash)} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                    Explorer <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function TxHistorySkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="py-3 border-border/60 bg-card/40">
          <CardContent className="flex items-center gap-3 px-4">
            <Skeleton className="size-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
