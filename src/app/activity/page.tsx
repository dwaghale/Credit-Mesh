"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EventFeed } from "@/components/feed/event-feed";
import { TransactionHistory } from "@/components/tx/transaction-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Activity</h1>
        <p className="text-muted-foreground text-sm">
          Live on-chain events from the CreditMesh contract and the status of your transactions.
        </p>
      </div>

      <Tabs defaultValue="events" className="gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="events">Event Feed</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventFeed />
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">What am I looking at?</CardTitle>
              <CardDescription>
                Every entry is a Soroban contract event emitted by CreditMesh — loan requests,
                fundings, repayments, defaults, pool deposits and withdrawals — streamed live
                from the Stellar testnet RPC with no page refresh.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p><strong className="text-foreground">loan_req</strong> — a borrower opened a new request.</p>
              <p><strong className="text-foreground">funded</strong> — a lender escrowed capital into a loan.</p>
              <p><strong className="text-foreground">repaid</strong> — borrower cleared principal + interest.</p>
              <p><strong className="text-foreground">default</strong> — deadline passed; insurance pool covered lenders.</p>
              <p><strong className="text-foreground">pool_dep</strong> / <strong className="text-foreground">withdrew</strong> — pool deposits and lender payouts.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
