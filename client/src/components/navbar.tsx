"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Network,
  Activity,
  Landmark,
  LayoutDashboard,
  Store,
  Home,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { ConnectButton } from "@/components/wallet/connect-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-bold tracking-tight transition-transform active:scale-95"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="bg-gradient-to-tr from-primary to-indigo-600 flex size-9 items-center justify-center rounded-xl text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <Network className="size-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-bold text-foreground">CreditMesh</span>
                <span className="bg-primary/10 text-primary hidden sm:inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
                  v1.0
                </span>
              </div>
              <span className="text-muted-foreground hidden text-[10px] font-medium sm:block">
                P2P Crowdlending
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectButton />

          {/* Mobile Hamburger Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-xl px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </div>
                  {active && <Sparkles className="size-3.5" />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

export function EmptyHint() {
  return <Landmark className="size-4" />;
}

export function FeedIcon() {
  return <Activity className="size-4" />;
}
