import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Network, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-12 sm:py-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Network className="size-3.5" /> Live on Stellar Testnet · Soroban
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          P2P crowdlending with{" "}
          <span className="text-primary">on-chain credit scores</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
          Borrowers raise loans from a crowd of lenders. Every repayment builds a transparent
          credit score, and a shared insurance pool makes lenders whole when borrowers default.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/marketplace">
            <Button size="lg" className="w-full sm:w-auto">
              Launch App <ArrowRight />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Wallet Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          icon={Users}
          title="Crowdfunded loans"
          description="Post a loan request with amount, term and APR. Multiple lenders co-fund it; funds are escrowed by the contract until the loan is fully funded."
        />
        <Feature
          icon={Gauge}
          title="On-chain credit score"
          description="300–900 score computed entirely in the contract: +100 per on-time repayment, −50 for late, −150 per default. No black boxes."
        />
        <Feature
          icon={ShieldCheck}
          title="Default-insurance pool"
          description="Anyone can backstop the network. When a loan defaults past its deadline, the pool automatically covers lenders' shortfall, pro-rata."
        />
      </section>

      {/* Flow */}
      <section>
        <h2 className="mb-4 text-center text-2xl font-semibold">How CreditMesh works</h2>
        <Card>
          <CardContent className="grid gap-4 pt-2 text-sm sm:grid-cols-5">
            {[
              "Borrower requests a loan",
              "Lenders fund it in parts",
              "Contract disburses to borrower at full funding",
              "Borrower repays principal + interest",
              "Lenders withdraw payouts — or pool covers defaults",
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full font-bold">
                  {i + 1}
                </span>
                <p className="text-muted-foreground">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="border-primary/20 from-primary/10 rounded-2xl border bg-gradient-to-br to-transparent p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Ready to lend or borrow?
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm sm:text-base">
          Connect any Stellar wallet — Freighter, Albedo, xBull, LOBSTR, Hana or Hot Wallet — and
          start building your on-chain credit reputation.
        </p>
        <Link href="/marketplace" className="mt-6 inline-block">
          <Button size="lg">
            Open Marketplace <ArrowRight />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="bg-primary/10 text-primary mb-1 flex size-10 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="leading-relaxed">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
