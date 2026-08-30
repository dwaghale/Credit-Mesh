import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  ShieldCheck,
  Network,
  Users,
  Sparkles,
  Coins,
  Lock,
  Zap,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 py-10 sm:py-16">
      {/* 1. Hero Section */}
      <section className="relative flex flex-col items-center gap-8 text-center pt-4">
        {/* Network Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary shadow-xs">
          <Network className="size-3.5 animate-pulse" />
          <span>Live on Stellar Soroban Testnet</span>
          <span className="text-primary/40">|</span>
          <span className="text-foreground/80 font-mono">100% On-Chain</span>
        </div>

        {/* Title */}
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Decentralized P2P Crowdlending with{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            On-Chain Credit
          </span>
        </h1>

        {/* Description */}
        <p className="text-muted-foreground max-w-2xl text-base sm:text-xl leading-relaxed">
          Empowering borrowers with community-funded loans and transparent credit scores, while
          protecting lenders through mutualized default-insurance pools.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
          <Link href="/marketplace">
            <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95">
              Explore Marketplace <ArrowRight className="size-4 ml-1" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 text-base font-semibold border-border/80 bg-card/60 backdrop-blur-md hover:bg-muted">
              Connect Dashboard
            </Button>
          </Link>
        </div>

        {/* Live Protocol Highlight Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mt-4 pt-4 border-t border-border/60 text-left">
          <HeroStat label="Smart Contract" value="Soroban Rust" icon={Lock} />
          <HeroStat label="Credit Engine" value="300 – 900 Score" icon={Gauge} />
          <HeroStat label="Lender Backstop" value="Mutualized Pool" icon={ShieldCheck} />
          <HeroStat label="Settlement" value="Instant & Auto" icon={Zap} />
        </div>

        {/* Interactive UI Mockup Preview */}
        <div className="w-full max-w-4xl mt-6 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-500/80" />
              <span className="size-3 rounded-full bg-amber-500/80" />
              <span className="size-3 rounded-full bg-emerald-500/80" />
              <span className="font-mono text-[11px] ml-2 text-foreground/80">creditmesh.stellar/marketplace</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">Live Demo Protocol</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-left">
            {/* Preview Card 1: Sample Loan */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Loan #42 · P2P Microloan</span>
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                  Seeking Funding
                </Badge>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-extrabold text-foreground">1,500.00 XLM</span>
                <span className="text-primary font-bold text-xs">12.0% APR · 30 Days</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Funded 1,125 / 1,500 XLM (3 Lenders)</span>
                  <span className="font-bold text-primary">75%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full w-3/4" />
                </div>
              </div>
            </div>

            {/* Preview Card 2: Credit Score Profile */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Gauge className="size-4 text-emerald-500" /> On-Chain Credit Profile
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                  Excellent Tier
                </Badge>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-emerald-500">780</span>
                <span className="text-muted-foreground text-xs font-medium">/ 900 Points</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                <div className="bg-muted/50 p-1.5 rounded">
                  <span className="text-muted-foreground block">Repaid On-Time</span>
                  <span className="font-bold text-foreground">+300 Pts</span>
                </div>
                <div className="bg-muted/50 p-1.5 rounded">
                  <span className="text-muted-foreground block">Defaults</span>
                  <span className="font-bold text-emerald-500">0</span>
                </div>
                <div className="bg-muted/50 p-1.5 rounded">
                  <span className="text-muted-foreground block">Capacity</span>
                  <span className="font-bold text-primary">Max Cap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Pillars / Features */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Next-Generation Crowdlending Architecture
          </h2>
          <p className="text-muted-foreground text-sm">
            CreditMesh redefines credit and loans by eliminating financial intermediaries.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={Users}
            title="Crowdfunded Multi-Lender"
            description="Borrowers post requests with fixed term & APR. Multiple community lenders co-fund any amount until 100% funded."
            tag="Escrow Escaped"
          />
          <Feature
            icon={Gauge}
            title="Decentralized Credit Score"
            description="300–900 score calculated purely on Soroban: +100 per on-time repayment, -50 late, -150 per default. Zero black boxes."
            tag="Auditable"
          />
          <Feature
            icon={ShieldCheck}
            title="Mutual Default Insurance"
            description="Anyone can backstop the pool. When a loan defaults past its deadline, the pool makes lenders whole pro-rata."
            tag="Risk Protected"
          />
        </div>
      </section>

      {/* 3. Step-by-Step Flow */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How CreditMesh Works</h2>
          <p className="text-muted-foreground text-sm">
            Five simple steps from loan request to automated yield distribution.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {[
            {
              step: "1",
              title: "Request Loan",
              desc: "Borrower defines amount, term (e.g. 30d) and offered APR.",
              icon: FileSignature,
            },
            {
              step: "2",
              title: "Crowd Funding",
              desc: "Mesh lenders escrow capital in parts into the smart contract.",
              icon: Coins,
            },
            {
              step: "3",
              title: "Auto Disbursal",
              desc: "Upon 100% funding, contract transfers full principal to borrower.",
              icon: Zap,
            },
            {
              step: "4",
              title: "Repayment",
              desc: "Borrower repays principal + interest before the deadline.",
              icon: CheckCircle2,
            },
            {
              step: "5",
              title: "Lender Payout",
              desc: "Lenders withdraw earnings — or pool covers defaulted balance.",
              icon: TrendingUp,
            },
          ].map(({ step, title, desc, icon: Icon }) => (
            <Card
              key={step}
              className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl font-bold text-sm border border-primary/20">
                  <Icon className="size-5" />
                </div>
                <span className="font-bold text-sm text-foreground">{title}</span>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className="space-y-6 max-w-3xl mx-auto w-full">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm">
            Everything you need to know about borrowing and lending on CreditMesh.
          </p>
        </div>

        <div className="space-y-3">
          <FaqItem
            q="How does the insurance pool protect lenders?"
            a="When a loan passes its deadline without full repayment, any user can trigger default. The Soroban smart contract automatically pulls liquidity from the insurance pool to make lenders whole up to their pro-rata contribution."
          />
          <FaqItem
            q="How is my credit score calculated?"
            a="Scores begin at 600 points (bounded between 300 and 900). Every on-time full repayment adds +100 points. Late repayments deduct -50 points, and defaults deduct -150 points. The entire formula is executed on-chain."
          />
          <FaqItem
            q="Which wallets are supported?"
            a="CreditMesh supports all major Stellar wallets via Stellar Wallets Kit: Freighter, Albedo, xBull, LOBSTR, Hana, and Hot Wallet."
          />
        </div>
      </section>

      {/* 5. Call To Action */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card/80 to-indigo-600/10 p-8 text-center sm:p-14 shadow-xl">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> Start Earning or Borrowing Today
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Build Your On-Chain Reputation?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Connect any Stellar testnet wallet to request a crowdloan, fund community requests, or deposit into the insurance pool.
          </p>
          <div className="pt-2">
            <Link href="/marketplace">
              <Button size="lg" className="h-12 px-8 font-semibold shadow-lg shadow-primary/25">
                Open Marketplace <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl">
      <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-xs sm:text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
  tag,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <Card className="group relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md p-5 transition-all hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="p-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl border border-primary/20 transition-transform group-hover:scale-105">
            <Icon className="size-5" />
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {tag}
          </Badge>
        </div>
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-4 space-y-1.5 text-left">
      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <HelpCircle className="size-4 text-primary shrink-0" />
        {q}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed pl-6">{a}</p>
    </div>
  );
}
