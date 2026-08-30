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
import {
  Wallet,
  Coins,
  Copy,
  ExternalLink,
  Plus,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { stroopsToXlm } from "@/lib/format";
import { explorerAccountUrl } from "@/config";
import Link from "next/link";

export default function DashboardPage() {
  const { address, walletName, isConnected, connect } = useWallet();
  const balance = useXlmBalance(address);
  const stats = useUserStats(address);
  const pool = usePoolBalance();
  const loans = useLoans();

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 px-4 text-center max-w-lg mx-auto">
        <div className="bg-primary/10 text-primary p-4 rounded-2xl border border-primary/20 shadow-md">
          <Wallet className="size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Connect Your Wallet</h1>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Connect Freighter, Albedo, or any supported Stellar wallet to view your on-chain credit score, active loans, lending yields, and balance.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => void connect()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 h-11 px-6"
        >
          <Wallet className="size-4 mr-2" /> Connect Stellar Wallet
        </Button>
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
    <div className="flex flex-col gap-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Account Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Real-time on-chain metrics, credit history, and position summaries for your connected wallet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/marketplace">
            <Button variant="default" size="sm" className="gap-1.5 shadow-sm">
              <Plus className="size-4" /> New Loan / Fund
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Row: Wallet Card + Credit Score */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet info */}
        <Card className="lg:col-span-1 border border-border/80 bg-card/60 backdrop-blur-md shadow-sm gap-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                  <Wallet className="size-4" />
                </div>
                Connected Account
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {walletName ?? "Stellar Wallet"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Stellar Testnet Account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1 text-sm">
            <div className="bg-muted/40 rounded-xl p-3 border border-border/40 space-y-1">
              <p className="text-muted-foreground text-[11px] font-medium">Public Address</p>
              <button
                className="group flex w-full items-center justify-between font-mono text-xs text-foreground/90 hover:text-primary transition-colors cursor-pointer text-left break-all"
                onClick={() => {
                  void navigator.clipboard.writeText(address);
                  toast.success("Address copied to clipboard");
                }}
                title="Click to copy address"
              >
                <span>{address}</span>
                <Copy className="size-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-muted/40 rounded-xl p-3 border border-border/40">
              <div>
                <p className="text-muted-foreground text-[11px] flex items-center gap-1 font-medium">
                  <Coins className="size-3 text-primary" /> Available Balance
                </p>
                {balance.isLoading ? (
                  <Skeleton className="mt-1 h-6 w-24 rounded" />
                ) : (
                  <p className="text-xl font-extrabold text-foreground tabular-nums">
                    {balance.data ?? "0.00"}{" "}
                    <span className="text-xs font-semibold text-muted-foreground">XLM</span>
                  </p>
                )}
              </div>

              <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:bg-primary/10 h-8">
                <a href={explorerAccountUrl(address)} target="_blank" rel="noreferrer">
                  Explorer <ExternalLink className="size-3 ml-1" />
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-muted-foreground">Network Environment</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                Stellar Soroban Testnet
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Credit score */}
        <div className="lg:col-span-2">
          <CreditScoreCard />
        </div>
      </div>

      {/* Portfolio summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Borrower Portfolio"
          icon={TrendingUp}
          lines={[
            ["Loans Requested", String(myBorrowed.length)],
            ["Active Borrowings", String(myBorrowed.filter((l) => l.status.tag === "Active").length)],
            ["Outstanding Due", `${stroopsToXlm(outstanding)} XLM`],
          ]}
          loading={loans.isLoading}
        />
        <SummaryCard
          title="Lender Positions"
          icon={Coins}
          lines={[
            ["Funded Positions", String(myLent.length)],
            ["Active Lending", String(myLent.filter((l) => l.status === "Active").length)],
            [
              "Total Capital Lended",
              `${stroopsToXlm(myLent.reduce((acc, p) => acc + p.amount, 0n))} XLM`,
            ],
          ]}
          loading={loans.isLoading}
        />
        <SummaryCard
          title="Insurance Coverage"
          icon={ShieldCheck}
          lines={[
            ["Total Pool Reserves", pool.isLoading ? "…" : `${stroopsToXlm(pool.data ?? 0)} XLM`],
            ["Your Recorded Defaults", String(stats.data?.defaults ?? 0)],
            ["Default Backstop Protection", "Active (100%)"],
          ]}
          loading={pool.isLoading}
        />
      </div>

      {/* Activity & Transactions Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground">Your On-Chain Events</h2>
            <Badge variant="secondary" className="text-[10px]">Filtered to Wallet</Badge>
          </div>
          <EventFeed mineOnly />
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground">Signed Transactions</h2>
            <Badge variant="secondary" className="text-[10px]">Client Session</Badge>
          </div>
          <TransactionHistory />
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  icon: Icon,
  lines,
  loading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  lines: [string, string][];
  loading?: boolean;
}) {
  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm py-4 gap-0">
      <CardHeader className="pb-3 pt-0 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
            <Icon className="size-3.5" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-5 pt-0">
        {lines.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{k}</span>
            {loading ? (
              <Skeleton className="h-4 w-16 rounded" />
            ) : (
              <span className="font-bold text-foreground tabular-nums">{v}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
