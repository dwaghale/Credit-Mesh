"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCreditScore, useUserStats } from "@/hooks/use-contract-data";
import { useWallet } from "@/hooks/use-wallet";
import { Gauge, CircleCheck, Clock4, ShieldAlert, FileSignature, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function scoreTier(score: number): {
  label: string;
  variant: "success" | "warning" | "destructive" | "secondary";
  textColor: string;
  badgeBg: string;
  description: string;
} {
  if (score >= 750)
    return {
      label: "Excellent Tier",
      variant: "success",
      textColor: "text-emerald-500",
      badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      description: "Highest trust rating. Eligible for maximum loan sizes and lowest APRs.",
    };
  if (score >= 650)
    return {
      label: "Good Tier",
      variant: "secondary",
      textColor: "text-blue-500",
      badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      description: "Reliable borrower. Consistent on-time repayment history.",
    };
  if (score >= 500)
    return {
      label: "Fair Tier",
      variant: "warning",
      textColor: "text-amber-500",
      badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      description: "Average reputation. Continue on-time repayments to reach Good tier.",
    };
  return {
    label: "Needs Improvement",
    variant: "destructive",
    textColor: "text-rose-500",
    badgeBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    description: "Lower score due to past defaults or late repayments.",
  };
}

export function CreditScoreCard() {
  const { address, isConnected } = useWallet();
  const score = useCreditScore(address);
  const stats = useUserStats(address);

  if (!isConnected || !address) {
    return (
      <Card className="border border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Gauge className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">On-Chain Credit Score</CardTitle>
              <CardDescription>
                Connect your wallet to inspect your transparent Soroban credit rating.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const s = score.data ?? 600;
  const tier = scoreTier(s);
  const st = stats.data;
  const clamped = Math.min(900, Math.max(300, s));
  const pct = ((clamped - 300) / (900 - 300)) * 100;

  return (
    <Card className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-primary/20 to-indigo-500/20 text-primary p-2 rounded-xl border border-primary/20">
              <Gauge className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                On-Chain Credit Score
                <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                  (Soroban Contract)
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Transparently calculated from your on-chain loan repayment record.
              </CardDescription>
            </div>
          </div>

          <Badge className={cn("px-2.5 py-1 text-xs font-semibold border", tier.badgeBg)}>
            <Sparkles className="size-3 mr-1 inline" />
            {tier.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Score Display & Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              {score.isLoading ? (
                <Skeleton className="h-10 w-28 rounded-lg" />
              ) : (
                <>
                  <span className={cn("text-4xl font-extrabold tracking-tight tabular-nums", tier.textColor)}>
                    {s}
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">/ 900</span>
                </>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Range: 300 – 900</span>
          </div>

          {/* Visual Custom Progress Bar with Gradient */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 via-blue-500 to-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>

          {/* Milestone markers */}
          <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-mono">
            <span>300 (Poor)</span>
            <span>500 (Fair)</span>
            <span>650 (Good)</span>
            <span>750+ (Excellent)</span>
            <span>900</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat
            icon={FileSignature}
            label="Loans Taken"
            value={st?.loans_taken ?? 0}
            loading={stats.isLoading}
            color="text-indigo-500"
          />
          <Stat
            icon={CircleCheck}
            label="On-time Repaid"
            value={st?.repaid_on_time ?? 0}
            loading={stats.isLoading}
            color="text-emerald-500"
            subtext="+100 pts"
          />
          <Stat
            icon={Clock4}
            label="Late Repaid"
            value={st?.repaid_late ?? 0}
            loading={stats.isLoading}
            color="text-amber-500"
            subtext="-50 pts"
          />
          <Stat
            icon={ShieldAlert}
            label="Defaults"
            value={st?.defaults ?? 0}
            loading={stats.isLoading}
            color="text-rose-500"
            subtext="-150 pts"
          />
        </div>

        {/* Info box */}
        <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2 border border-border/40">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {tier.description}{" "}
            <span className="text-foreground font-medium">
              Every on-time repayment adds +100 points, boosting your borrowing capacity across CreditMesh.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  loading,
  color,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  loading: boolean;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="bg-card/70 border border-border/60 flex items-center gap-2.5 rounded-xl p-3 transition-colors hover:bg-muted/50">
      <div className={cn("size-8 rounded-lg flex items-center justify-center bg-muted/80 shrink-0", color)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground truncate text-[11px] font-medium">{label}</p>
        {loading ? (
          <Skeleton className="mt-0.5 h-4 w-8" />
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm tabular-nums text-foreground">{value}</p>
            {subtext && (
              <span className="text-[10px] text-muted-foreground font-mono">({subtext})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
