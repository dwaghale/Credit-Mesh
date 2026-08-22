/**
 * CreditMesh global configuration.
 * The deployed contract ID is stored here — override via env for other networks.
 */

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ??
  "CAEFU3SKK7E5H7DXAMNZ62KV3OWHS4E3XZOJLDUMSM2KHYQ5ZIBGLHFR";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const NETWORK_NAME = "testnet" as const;

export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export function explorerTxUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function explorerAccountUrl(address: string) {
  return `https://stellar.expert/explorer/testnet/account/${address}`;
}
