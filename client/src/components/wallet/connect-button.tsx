"use client";

import { useCallback, useState } from "react";
import { Copy, Check, Loader2, LogOut, Wallet, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/hooks/use-wallet";
import { shortAddress } from "@/lib/format";
import { explorerAccountUrl } from "@/config";

export function ConnectButton() {
  const { address, walletName, isConnected, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = useCallback(() => {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Stellar address copied to clipboard", {
      description: address,
    });
  }, [address]);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    try {
      await connect();
    } finally {
      setBusy(false);
    }
  }, [connect]);

  if (!isConnected || !address) {
    return (
      <Button
        onClick={() => void handleConnect()}
        disabled={busy}
        data-wallet-modal-trigger
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] h-9 px-3.5 text-xs sm:text-sm"
      >
        {busy ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Wallet className="size-4 mr-1.5" />}
        <span>Connect Wallet</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-9 border-border/80 bg-card/60 backdrop-blur-md hover:bg-accent hover:border-primary/40 font-mono text-xs sm:text-sm px-3 shadow-xs"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold">{shortAddress(address, 4)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2 shadow-xl border-border/80 bg-card/95 backdrop-blur-xl">
        <DropdownMenuLabel className="p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" /> {walletName ?? "Stellar Wallet"}
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              Testnet
            </Badge>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-1 break-all select-all bg-muted/40 p-1.5 rounded border border-border/40">
            {address}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={copy} className="gap-2 text-xs cursor-pointer py-2">
          {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          <span>{copied ? "Copied to clipboard!" : "Copy public key"}</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer py-2">
          <a href={explorerAccountUrl(address)} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2">
              <ExternalLink className="size-4" /> View on Stellar Expert
            </span>
            <span className="text-muted-foreground text-[10px]">↗</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive gap-2 text-xs cursor-pointer py-2 focus:bg-destructive/10"
          onSelect={() => void disconnect()}
        >
          <LogOut className="size-4" /> Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
