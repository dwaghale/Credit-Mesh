"use client";

import { useCallback, useState } from "react";
import { Copy, Check, Loader2, LogOut, Wallet } from "lucide-react";
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
    setTimeout(() => setCopied(false), 1500);
    toast.success("Address copied");
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
      <Button onClick={() => void handleConnect()} disabled={busy} data-wallet-modal-trigger>
        {busy ? <Loader2 className="animate-spin" /> : <Wallet />}
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="font-mono text-xs sm:text-sm">{shortAddress(address)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{walletName ?? "Wallet"}</span>
            <span className="font-mono text-xs break-all">{shortAddress(address, 8)}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={copy}>
          {copied ? <Check /> : <Copy />} Copy address
        </DropdownMenuItem>
        <a href={explorerAccountUrl(address)} target="_blank" rel="noreferrer">
          <DropdownMenuItem>View on explorer ↗</DropdownMenuItem>
        </a>
        <Badge variant="secondary" className="mx-2 my-1">Testnet</Badge>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void disconnect()}>
          <LogOut /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
