"use client";

import { Loader2, CircleCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTxStore } from "@/store/tx-store";
import { shortAddress, timeAgo } from "@/lib/format";
import { explorerTxUrl } from "@/config";

const STATUS_META = {
  PENDING: {
    icon: Loader2,
    badge: <Badge variant="warning">Pending</Badge>,
    spin: true,
  },
  SUCCESS: {
    icon: CircleCheck,
    badge: <Badge variant="success">Success</Badge>,
    spin: false,
  },
  FAILED: {
    icon: XCircle,
    badge: <Badge variant="destructive">Failed</Badge>,
    spin: false,
  },
} as const;

export function TransactionHistory() {
  const transactions = useTxStore((s) => s.transactions);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
        <p className="font-medium">No transactions yet</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Transactions you sign through CreditMesh appear here with live status and explorer links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const meta = STATUS_META[tx.status];
        const Icon = meta.icon;
        return (
          <Card key={tx.hash} className="py-3">
            <CardContent className="flex items-center gap-3 px-4">
              <Icon
                className={
                  tx.status === "SUCCESS"
                    ? "size-5 shrink-0 text-success"
                    : tx.status === "FAILED"
                      ? "text-destructive size-5 shrink-0"
                      : "size-5 shrink-0 animate-pulse"
                }
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium">{tx.method}</span>
                  {meta.badge}
                </div>
                <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                  {shortAddress(tx.hash, 10)} · {timeAgo(tx.status === "PENDING" ? tx.createdAt : tx.updatedAt)}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={explorerTxUrl(tx.hash)} target="_blank" rel="noreferrer">
                  Explorer ↗
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function TxHistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="py-3">
          <CardContent className="flex items-center gap-3 px-4">
            <Skeleton className="size-5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
