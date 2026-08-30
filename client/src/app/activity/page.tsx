"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EventFeed } from "@/components/feed/event-feed";
import { TransactionHistory } from "@/components/tx/transaction-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_ID } from "@/config";
import { Activity, Clock, ShieldCheck, ExternalLink, Copy, Terminal } from "lucide-react";
import { toast } from "sonner";

export default function ActivityPage() {
  const copyContract = () => {
    void navigator.clipboard.writeText(CONTRACT_ID);
    toast.success("Contract address copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Protocol Activity
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              Live Stream
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Real-time on-chain events emitted by the CreditMesh smart contract and your browser session transaction log.
          </p>
        </div>

        {/* Contract ID pill */}
        <button
          onClick={copyContract}
          className="flex items-center gap-2 bg-card/80 border border-border/80 hover:border-primary/40 rounded-xl px-3.5 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          title="Click to copy contract ID"
        >
          <Terminal className="size-3.5 text-primary shrink-0" />
          <span>{CONTRACT_ID.slice(0, 8)}…{CONTRACT_ID.slice(-6)}</span>
          <Copy className="size-3 opacity-60" />
        </button>
      </div>

      <Tabs defaultValue="events" className="gap-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 p-1 bg-muted/60">
          <TabsTrigger value="events" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Activity className="size-4" /> Live Event Feed
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Clock className="size-4" /> Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="grid gap-6 lg:grid-cols-3 mt-4">
          <div className="lg:col-span-2">
            <EventFeed />
          </div>

          <div className="space-y-4">
            <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> How Events Work
                </CardTitle>
                <CardDescription className="text-xs">
                  Every entry represents a verified Stellar Soroban smart contract event streamed directly from the testnet RPC.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <p className="font-semibold text-blue-500">loan_req</p>
                  <p className="text-muted-foreground text-[11px]">A borrower initiated a crowdloan request with custom term & APR.</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <p className="font-semibold text-indigo-500">funded</p>
                  <p className="text-muted-foreground text-[11px]">A lender escrowed capital. 100% funding auto-disburses to borrower.</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <p className="font-semibold text-emerald-500">repaid</p>
                  <p className="text-muted-foreground text-[11px]">Borrower cleared loan debt. Credit score updated (+100 or -50).</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <p className="font-semibold text-rose-500">default</p>
                  <p className="text-muted-foreground text-[11px]">Deadline expired: insurance pool backstop made lenders whole.</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                  <p className="font-semibold text-amber-500">pool_dep / withdrew</p>
                  <p className="text-muted-foreground text-[11px]">Insurance pool liquidity deposits and lender yield withdrawals.</p>
                </div>
              </CardContent>
            </Card>

            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 text-xs font-semibold text-foreground transition-all shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Activity className="size-4 text-primary" /> View Contract on Stellar Expert
              </span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 max-w-2xl">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
