"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoans, usePoolBalance } from "@/hooks/use-contract-data";
import { stroopsToXlm } from "@/lib/format";
import { ShieldCheck, Landmark, Users, HandCoins, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsBar() {
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: pool, isLoading: poolLoading } = usePoolBalance();

  const total = loans?.length ?? 0;
  const active = loans?.filter((l) => l.status.tag === "Active").length ?? 0;
  const fundedXlm = loans
    ?.filter((l) => l.status.tag === "Repaid")
    .reduce((acc, l) => acc + BigInt(l.principal), BigInt(0));

  const stats = [
    {
      label: "Insurance Pool",
      subtext: "Community default backstop",
      value: poolLoading ? null : `${stroopsToXlm(pool ?? 0)} XLM`,
      icon: ShieldCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Total Loans Created",
      subtext: "All time on Soroban",
      value: loansLoading ? null : String(total),
      icon: Landmark,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Active Loans",
      subtext: "Currently in repayment",
      value: loansLoading ? null : String(active),
      icon: Users,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Volume Repaid",
      subtext: "Successfully settled",
      value: loansLoading ? null : `${stroopsToXlm(fundedXlm ?? 0)} XLM`,
      icon: HandCoins,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, subtext, value, icon: Icon, color, bgColor }) => (
        <Card
          key={label}
          className="group relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-md py-4 gap-0"
        >
          <div className="absolute top-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100 hidden sm:block">
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </div>

          <CardContent className="flex items-center gap-3.5 px-4 pt-0">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105",
                color,
                bgColor,
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground truncate text-xs font-medium">{label}</p>
              {value === null ? (
                <Skeleton className="mt-1 h-5 w-24 rounded-md" />
              ) : (
                <p className="truncate text-base sm:text-lg font-bold tracking-tight text-foreground tabular-nums">
                  {value}
                </p>
              )}
              <p className="text-muted-foreground/70 hidden truncate text-[10px] sm:block">
                {subtext}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
