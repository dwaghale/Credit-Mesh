"use client";

import { useLoans } from "@/hooks/use-contract-data";
import { LoanCard } from "@/components/contract/loan-card";
import { CreateLoanDialog } from "@/components/contract/create-loan-dialog";
import { StatsBar } from "@/components/contract/stats-bar";
import { PoolCard } from "@/components/contract/pool-card";
import { EventFeed } from "@/components/feed/event-feed";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Inbox } from "lucide-react";
import { useEffect, useState } from "react";

export default function MarketplacePage() {
  const { data: loans, isLoading } = useLoans();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Keep countdowns ticking without re-rendering the whole tree aggressively.
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(id);
  }, []);

  const pending = loans?.filter((l) => l.status.tag === "Pending") ?? [];
  const active = loans?.filter((l) => l.status.tag === "Active") ?? [];
  const closed = loans?.filter((l) => l.status.tag === "Repaid" || l.status.tag === "Defaulted") ?? [];

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Lending Marketplace</h1>
          <p className="text-muted-foreground text-sm">
            Fund borrowers directly or request a loan — all state lives on Soroban.
          </p>
        </div>
        <CreateLoanDialog />
      </div>

      <StatsBar />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending" className="gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending">Open ({pending.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <LoanList loans={pending} now={now} isLoading={isLoading} emptyLabel="No open loan requests right now." />
            </TabsContent>
            <TabsContent value="active">
              <LoanList loans={active} now={now} isLoading={isLoading} emptyLabel="No active loans." />
            </TabsContent>
            <TabsContent value="closed">
              <LoanList loans={closed} now={now} isLoading={isLoading} emptyLabel="Nothing here yet — completed and defaulted loans will show up." />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <PoolCard />
          <Card>
            <CardContent className="pt-0">
              <h2 className="mb-3 mt-1 text-sm font-semibold">Live Network Activity</h2>
              <EventFeed />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoanList({
  loans,
  now,
  isLoading,
  emptyLabel,
}: {
  loans: Awaited<ReturnType<typeof useLoans>["data"]>;
  now: number;
  isLoading: boolean;
  emptyLabel: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Card key={i} className="py-5">
            <CardContent className="space-y-3 px-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (!loans || loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
        <Inbox className="text-muted-foreground mb-3 size-8" />
        <p className="font-medium">{emptyLabel}</p>
        <p className="text-muted-foreground mt-1 text-sm">Be the first — create a request above.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} now={now} />
      ))}
    </div>
  );
}
