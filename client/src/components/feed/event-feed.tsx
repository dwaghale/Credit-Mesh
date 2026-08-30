"use client";

import { useState } from "react";
import {
  FilePlus2,
  HandCoins,
  CircleCheck,
  ShieldAlert,
  ShieldCheck,
  Banknote,
  Activity,
  ExternalLink,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
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
  { icon: React.ComponentType<{ className?: string }>; label: string; className: string; category: string }
> = {
  loan_req: { icon: FilePlus2, label: "Loan Request", className: "text-blue-500 bg-blue-500/10 border-blue-500/20", category: "loans" },
  funded: { icon: HandCoins, label: "Funded", className: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20", category: "funding" },
  repaid: { icon: CircleCheck, label: "Repayment", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", category: "repayment" },
  default: { icon: ShieldAlert, label: "Loan Default", className: "text-rose-500 bg-rose-500/10 border-rose-500/20", category: "default" },
  pool_dep: { icon: ShieldCheck, label: "Pool Deposit", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", category: "pool" },
  withdrew: { icon: Banknote, label: "Payout Withdrawn", className: "text-amber-500 bg-amber-500/10 border-amber-500/20", category: "withdrawal" },
};

const CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "loans", label: "Loans" },
  { id: "funding", label: "Funding" },
  { id: "repayment", label: "Repayments" },
  { id: "pool", label: "Pool" },
];

export function EventFeed({ mineOnly = false }: { mineOnly?: boolean }) {
  const { data: events, isLoading, isError } = useEvents();
  const { address } = useWallet();
  const [filter, setFilter] = useState("all");

  const filtered = useMemoFilter(events ?? [], mineOnly ? address : null, filter);

  const copyHash = (hash: string) => {
    void navigator.clipboard.writeText(hash);
    toast.success("Transaction hash copied");
  };

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="py-3 border-border/60 bg-card/40">
            <CardContent className="flex items-center gap-3 px-4">
              <Skeleton className="size-9 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
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
        title="Could not stream live events"
        description="The Stellar RPC testnet endpoint may be busy — polling will retry automatically."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Tabs / Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {CATEGORIES.map((c) => (
          <Button
            key={c.id}
            type="button"
            size="sm"
            variant={filter === c.id ? "default" : "outline"}
            onClick={() => setFilter(c.id)}
            className="text-xs h-7 px-2.5 rounded-lg"
          >
            {c.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={mineOnly ? "No events for your address yet" : "No matching activity found"}
          description={
            mineOnly
              ? "Interact with loans or the insurance pool to see your live events here."
              : "Contract interactions will appear in real time."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => {
            const meta = EVENT_META[e.type] ?? EVENT_META.funded;
            const Icon = meta.icon;
            return (
              <Card
                key={e.id}
                className="group relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md py-3 transition-all hover:border-primary/40 hover:bg-card/90"
              >
                <CardContent className="flex items-start gap-3 px-4 pt-0">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105",
                      meta.className,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-foreground tracking-tight">
                        {meta.label}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                        {shortAddress(e.actor, 5)}
                        {address && e.actor.toLowerCase() === address.toLowerCase() && " (You)"}
                      </Badge>
                      {e.amount && (
                        <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary">
                          {e.amount} XLM
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {e.action} · <span className="font-medium text-foreground/70">{timeAgo(e.timestamp)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg opacity-60 hover:opacity-100"
                      onClick={() => copyHash(e.txHash)}
                      title="Copy transaction hash"
                    >
                      <Copy className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg opacity-60 hover:opacity-100 text-primary"
                      asChild
                      title="View on Stellar Expert"
                    >
                      <a href={explorerTxUrl(e.txHash)} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useMemoFilter<T extends { actor: string; type: string }>(
  events: T[],
  address: string | null,
  category: string,
): T[] {
  let list = events;
  if (address) {
    const lower = address.toLowerCase();
    list = list.filter((e) => e.actor.toLowerCase() === lower);
  }
  if (category !== "all") {
    list = list.filter((e) => {
      const meta = EVENT_META[e.type];
      return meta && meta.category === category;
    });
  }
  return list.slice(0, 50);
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
    <div className="border border-dashed border-border/80 bg-card/30 rounded-xl px-6 py-12 text-center flex flex-col items-center justify-center">
      <div className="bg-muted/60 p-3 rounded-full mb-3 text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="font-semibold text-sm text-foreground">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">{description}</p>
    </div>
  );
}
