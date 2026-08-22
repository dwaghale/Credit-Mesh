"use client";

import {
  FilePlus2,
  HandCoins,
  CircleCheck,
  ShieldAlert,
  ShieldCheck,
  Banknote,
  Activity,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-events";
import { useWallet } from "@/hooks/use-wallet";
import { shortAddress, timeAgo } from "@/lib/format";
import { explorerTxUrl } from "@/config";
import { cn } from "@/lib/utils";

const EVENT_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; className: string }
> = {
  loan_req: { icon: FilePlus2, label: "Loan Requested", className: "text-blue-500 bg-blue-500/10" },
  funded: { icon: HandCoins, label: "Funded", className: "text-emerald-600 bg-emerald-500/10" },
  repaid: { icon: CircleCheck, label: "Repaid", className: "text-green-600 bg-green-500/10" },
  default: { icon: ShieldAlert, label: "Default", className: "text-red-500 bg-red-500/10" },
  pool_dep: { icon: ShieldCheck, label: "Pool Deposit", className: "text-primary bg-primary/10" },
  withdrew: { icon: Banknote, label: "Withdrawal", className: "text-amber-600 bg-amber-500/10" },
};

export function EventFeed({ mineOnly = false }: { mineOnly?: boolean }) {
  const { data: events, isLoading, isError } = useEvents();
  const { address } = useWallet();

  const filtered = useMemoFilter(events ?? [], mineOnly ? address : null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="py-3">
            <CardContent className="flex items-center gap-3 px-4">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Activity}
        title="Could not load activity"
        description="The RPC endpoint may be busy — it will retry automatically."
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title={mineOnly ? "No activity from your wallet yet" : "No on-chain activity yet"}
        description={
          mineOnly
            ? "Interact with loans or the insurance pool to see events here."
            : "Contract interactions will appear here in real time."
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((e) => {
        const meta = EVENT_META[e.type] ?? EVENT_META.funded;
        const Icon = meta.icon;
        return (
          <Card key={e.id} className="py-3 transition-colors hover:bg-muted/30">
            <CardContent className="flex items-start gap-3 px-4">
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.className)}>
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {shortAddress(e.actor, 5)}
                    {address && e.actor.toLowerCase() === address.toLowerCase() && " (you)"}
                  </Badge>
                  {e.amount && (
                    <Badge variant="secondary">{e.amount} XLM</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {e.action} · {timeAgo(e.timestamp)}
                </p>
              </div>
              <Button variant="ghost" size="icon" asChild title="View transaction">
                <a href={explorerTxUrl(e.txHash)} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function useMemoFilter<T extends { actor: string }>(events: T[], address: string | null): T[] {
  // simple filter without hooks-in-loop pitfalls
  if (!address) return events.slice(0, 50);
  const lower = address.toLowerCase();
  return events.filter((e) => e.actor.toLowerCase() === lower).slice(0, 50);
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border/60 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <Icon className="text-muted-foreground mb-3 size-8" />
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
    </div>
  );
}
