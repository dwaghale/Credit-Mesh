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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Inbox, Search, SlidersHorizontal, Activity } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

export default function MarketplacePage() {
  const { data: loans, isLoading } = useLoans();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "apr_asc" | "apr_desc" | "amount_desc">("newest");

  // Keep countdowns ticking without re-rendering the whole tree aggressively.
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(id);
  }, []);

  // Filter and sort loans
  const processedLoans = useMemo(() => {
    if (!loans) return [];
    let list = [...loans];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.id.toString().includes(q) ||
          l.borrower.toLowerCase().includes(q),
      );
    }

    if (sortBy === "apr_asc") list.sort((a, b) => a.apr_bps - b.apr_bps);
    if (sortBy === "apr_desc") list.sort((a, b) => b.apr_bps - a.apr_bps);
    if (sortBy === "amount_desc") list.sort((a, b) => (BigInt(b.principal) > BigInt(a.principal) ? 1 : -1));
    if (sortBy === "newest") list.sort((a, b) => b.id - a.id);

    return list;
  }, [loans, searchQuery, sortBy]);

  const pending = processedLoans.filter((l) => l.status.tag === "Pending");
  const active = processedLoans.filter((l) => l.status.tag === "Active");
  const closed = processedLoans.filter((l) => l.status.tag === "Repaid" || l.status.tag === "Defaulted");

  return (
    <div className="flex flex-col gap-8 py-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Lending Marketplace
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              Live on Soroban
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-xl">
            Co-fund community loan requests, earn transparent APR yields, or request peer-to-peer capital with on-chain credit scoring.
          </p>
        </div>

        <CreateLoanDialog />
      </div>

      {/* Real-time stats bar */}
      <StatsBar />

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 border border-border/80 rounded-xl p-3 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by loan ID (#) or borrower Stellar address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm bg-background/70 border-border/80"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-muted-foreground hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-lg border border-border/80 bg-background/80 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="apr_desc">Sort: Highest APR</option>
            <option value="apr_asc">Sort: Lowest APR</option>
            <option value="amount_desc">Sort: Largest Principal</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Loans List & Live Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="pending" className="gap-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 p-1 bg-muted/60">
              <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs sm:text-sm">
                Open Requests
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                  {pending.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-1.5 text-xs sm:text-sm">
                Active Loans
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                  {active.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center gap-1.5 text-xs sm:text-sm">
                Settled / Closed
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                  {closed.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4 space-y-3">
              <LoanList
                loans={pending}
                now={now}
                isLoading={isLoading}
                emptyTitle="No open loan requests at the moment"
                emptyDescription="All published requests have either been funded or none have been submitted yet. Be the first to create one!"
              />
            </TabsContent>

            <TabsContent value="active" className="mt-4 space-y-3">
              <LoanList
                loans={active}
                now={now}
                isLoading={isLoading}
                emptyTitle="No active loans currently in repayment"
                emptyDescription="When open loan requests reach 100% funding, they transition to active status and countdown repayment deadlines."
              />
            </TabsContent>

            <TabsContent value="closed" className="mt-4 space-y-3">
              <LoanList
                loans={closed}
                now={now}
                isLoading={isLoading}
                emptyTitle="No completed or defaulted loans yet"
                emptyDescription="Repaid loans and resolved defaults will be archived and displayed here."
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar: Pool & Live Activity */}
        <div className="space-y-6">
          <PoolCard />

          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Activity className="size-4 text-primary" /> Live Protocol Events
                </h2>
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
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
  emptyTitle,
  emptyDescription,
}: {
  loans: Awaited<ReturnType<typeof useLoans>["data"]>;
  now: number;
  isLoading: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="py-5 border-border/60 bg-card/40">
            <CardContent className="space-y-3 px-5">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10 rounded" />
                <Skeleton className="h-10 rounded" />
                <Skeleton className="h-10 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
        <div className="bg-primary/10 text-primary p-3.5 rounded-full mb-3">
          <Inbox className="size-8" />
        </div>
        <p className="font-bold text-base text-foreground">{emptyTitle}</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} now={now} />
      ))}
    </div>
  );
}
