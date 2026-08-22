"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCreditScore, useUserStats } from "@/hooks/use-contract-data";
import { useWallet } from "@/hooks/use-wallet";
import { Gauge, CircleCheck, Clock4, ShieldAlert, FileSignature } from "lucide-react";

function scoreLabel(score: number): { label: string; variant: "success" | "warning" | "destructive" | "secondary" } {
  if (score >= 750) return { label: "Excellent", variant: "success" };
  if (score >= 650) return { label: "Good", variant: "secondary" };
  if (score >= 500) return { label: "Fair", variant: "warning" };
  return { label: "Poor", variant: "destructive" };
}

export function CreditScoreCard() {
  const { address, isConnected } = useWallet();
  const score = useCreditScore(address);
  const stats = useUserStats(address);

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4" /> Your Credit Score
          </CardTitle>
          <CardDescription>Connect your wallet to view your on-chain credit profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const s = score.data ?? 600;
  const { label, variant } = scoreLabel(s);
  const st = stats.data;
  const pct = ((s - 300) / (900 - 300)) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4" /> Your Credit Score
          </CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <CardDescription>
          Computed fully on-chain from repayment history and defaults.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          {score.isLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <>
              <span className="text-4xl font-bold tabular-nums">{s}</span>
              <span className="text-muted-foreground pb-1 text-sm">/ 900</span>
            </>
          )}
        </div>
        <Progress value={pct} />
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat icon={FileSignature} label="Loans taken" value={st?.loans_taken ?? 0} loading={stats.isLoading} />
          <Stat icon={CircleCheck} label="On-time" value={st?.repaid_on_time ?? 0} loading={stats.isLoading} />
          <Stat icon={Clock4} label="Late" value={st?.repaid_late ?? 0} loading={stats.isLoading} />
          <Stat icon={ShieldAlert} label="Defaults" value={st?.defaults ?? 0} loading={stats.isLoading} />
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-2.5">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-[11px]">{label}</p>
        {loading ? (
          <Skeleton className="mt-0.5 h-4 w-8" />
        ) : (
          <p className="font-semibold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}
