import { rpc } from "@stellar/stellar-sdk";
import { RPC_URL, NETWORK_PASSPHRASE } from "@/config";
import { stroopsToXlm } from "@/lib/format";

let _server: rpc.Server | null = null;

/** Shared Soroban RPC server instance. */
export function server(): rpc.Server {
  if (!_server) {
    _server = new rpc.Server(RPC_URL, {
      allowHttp: RPC_URL.startsWith("http://"),
    });
  }
  return _server;
}

export { NETWORK_PASSPHRASE };

export async function getXlmBalance(address: string): Promise<string> {
  const entry = await server().getAccountEntry(address);
  return stroopsToXlm(entry.balance().toString());
}
