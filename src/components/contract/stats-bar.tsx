"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoans, usePoolBalance } from "@/hooks/use-contract-data";
import { stroopsToXlm } from "@/lib/format";
import { ShieldCheck, Landmark, Users, HandCoins } from "lucide-react";

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
      value: poolLoading ? null : `${stroopsToXlm(pool ?? 0)} XLM`,
      icon: ShieldCheck,
    },
    { label: "Total Loans", value: loansLoading ? null : String(total), icon: Landmark },
    { label: "Active Loans", value: loansLoading ? null : String(active), icon: Users },
    {
      label: "Volume Repaid",
      value: loansLoading ? null : `${stroopsToXlm(fundedXlm ?? 0)} XLM`,
      icon: HandCoins,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="gap-1 py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground truncate text-xs">{label}</p>
              {value === null ? (
                <Skeleton className="mt-1 h-5 w-20" />
              ) : (
                <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
