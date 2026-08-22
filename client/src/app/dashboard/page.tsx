"use client";

import { useWallet } from "@/hooks/use-wallet";
import { useLoans, usePoolBalance, useUserStats, useXlmBalance } from "@/hooks/use-contract-data";
import { CreditScoreCard } from "@/components/contract/credit-score-card";
import { EventFeed } from "@/components/feed/event-feed";
import { TransactionHistory } from "@/components/tx/transaction-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Wallet, Coins, Network, Copy } from "lucide-react";
import { toast } from "sonner";
import { stroopsToXlm } from "@/lib/format";

export default function DashboardPage() {
  const { address, walletName, isConnected, connect } = useWallet();
  const balance = useXlmBalance(address);
  const stats = useUserStats(address);
  const pool = usePoolBalance();
  const loans = useLoans();

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Wallet className="text-muted-foreground size-10" />
        <h1 className="text-2xl font-semibold">Connect your wallet</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Your dashboard shows your address, XLM balance, network, on-chain credit score and
          lending activity.
        </p>
        <Button onClick={() => void connect()}>Connect Wallet</Button>
      </div>
    );
  }

  const myBorrowed = (loans.data ?? []).filter(
    (l) => l.borrower.toLowerCase() === address.toLowerCase(),
  );
  const myLent = (loans.data ?? []).flatMap((l) =>
    Object.entries(l.contributions)
      .filter(([a]) => a.toLowerCase() === address.toLowerCase())
      .map(([, amt]) => ({ loan: l.id, amount: BigInt(amt), status: l.status.tag })),
  );
  const outstanding = myBorrowed
    .filter((l) => l.status.tag === "Active")
    .reduce((acc, l) => {
      const principal = BigInt(l.principal);
      const due = principal + (principal * BigInt(l.apr_bps)) / 10_000n;
      return acc + (due > BigInt(l.repaid) ? due - BigInt(l.repaid) : 0n);
    }, 0n);

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wallet Dashboard</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Wallet info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" /> Wallet
            </CardTitle>
            <CardDescription>{walletName ?? "Connected wallet"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">Address</p>
              <button
                className="group flex w-full items-center gap-1.5 font-mono text-xs break-all hover:text-primary"
                onClick={() => {
                  void navigator.clipboard.writeText(address);
                  toast.success("Address copied");
                }}
              >
                {address}
                <Copy className="opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 flex items-center gap-1 text-xs">
                <Coins className="size-3" /> XLM Balance
              </p>
              {balance.isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="font-semibold tabular-nums">{balance.data ?? "—"} XLM</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 flex items-center gap-1 text-xs">
                <Network className="size-3" /> Network
              </p>
              <Badge variant="secondary">Stellar Testnet</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Credit score */}
        <div className="lg:col-span-2">
          <CreditScoreCard />
        </div>
      </div>

      {/* Portfolio summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="As borrower"
          lines={[
            ["Loans requested", String(myBorrowed.length)],
            ["Outstanding debt", `${stroopsToXlm(outstanding)} XLM`],
          ]}
          loading={loans.isLoading}
        />
        <SummaryCard
          title="As lender"
          lines={[
            ["Positions", String(myLent.length)],
            [
              "Total contributed",
              `${stroopsToXlm(myLent.reduce((acc, p) => acc + p.amount, 0n))} XLM`,
            ],
          ]}
          loading={loans.isLoading}
        />
        <SummaryCard
          title="Insurance pool"
          lines={[
            ["Pool balance", pool.isLoading ? "…" : `${stroopsToXlm(pool.data ?? 0)} XLM`],
            ["Your defaults", String(stats.data?.defaults ?? 0)],
          ]}
          loading={pool.isLoading}
        />
      </div>

      {/* Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold">Your on-chain activity</h2>
          <EventFeed mineOnly />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Your transactions</h2>
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  lines,
  loading,
}: {
  title: string;
  lines: [string, string][];
  loading?: boolean;
}) {
  return (
    <Card className="py-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-6 pt-0">
        {lines.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{k}</span>
            {loading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="font-medium tabular-nums">{v}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
