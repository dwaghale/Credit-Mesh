"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Network, Activity, Landmark } from "lucide-react";
import { ConnectButton } from "@/components/wallet/connect-button";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/activity", label: "Activity" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary flex size-8 items-center justify-center rounded-lg text-white">
            <Network className="size-4" />
          </span>
          <span className="hidden text-base sm:block">CreditMesh</span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

export function EmptyHint() {
  return <Landmark className="size-4" />;
}

export function FeedIcon() {
  return <Activity className="size-4" />;
}
