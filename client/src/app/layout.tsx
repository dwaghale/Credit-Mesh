import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { CONTRACT_ID } from "@/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f1d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "CreditMesh — P2P Crowdlending & On-Chain Credit on Stellar",
  description:
    "Peer-to-peer crowdlending with decentralized credit scoring and default-insurance pools, powered by Stellar Soroban smart contracts.",
  keywords: [
    "Stellar",
    "Soroban",
    "P2P Lending",
    "DeFi",
    "Crowdlending",
    "On-chain Credit Score",
    "Microloans",
    "XLM",
  ],
  authors: [{ name: "CreditMesh Team" }],
  openGraph: {
    title: "CreditMesh — P2P Crowdlending on Stellar Soroban",
    description:
      "Decentralized peer-to-peer micro-lending with transparent on-chain credit scores and community insurance pools.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary relative`}
      >
        {/* Ambient background glows */}
        <div
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/15 blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute top-[40%] -left-32 w-[450px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full" />
          <div className="absolute bottom-20 -right-32 w-[500px] h-[400px] bg-indigo-500/10 blur-[140px] rounded-full" />
        </div>

        <Providers>
          {/* Top Testnet Notice Banner */}
          <div className="relative z-50 bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10 border-b border-primary/15 text-center text-xs py-1.5 px-4 font-medium flex items-center justify-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected to Stellar Testnet (Soroban Protocol)</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline text-primary hover:underline font-mono text-[11px]"
            >
              Contract: {CONTRACT_ID.slice(0, 6)}…{CONTRACT_ID.slice(-4)} ↗
            </a>
          </div>

          <Navbar />

          <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 pb-20">
            {children}
          </main>

          <footer className="relative z-10 border-t border-border/60 bg-card/40 backdrop-blur-md py-8 text-xs text-muted-foreground">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary p-1.5 rounded-md">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="font-semibold text-foreground text-sm">CreditMesh</span>
                <span className="text-muted-foreground/60">·</span>
                <span>Decentralized Crowdlending</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <Link href="/marketplace" className="hover:text-foreground transition-colors">
                  Marketplace
                </Link>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/activity" className="hover:text-foreground transition-colors">
                  Live Activity
                </Link>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Activity className="size-3" /> Explorer
                </a>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                Built on Stellar Soroban
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
