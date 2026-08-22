/**
 * One-time initializer for the deployed CreditMesh contract.
 *
 * The contract's money-moving functions (fund_loan, repay, deposit_pool,
 * withdraw) call `token()`, which traps with Error(WasmVm, InvalidAction)
 * if `initialize(token)` was never called after deployment.
 *
 * This script:
 *   1. Creates + funds a throwaway testnet key via Friendbot
 *   2. Calls `initialize` with the native XLM Stellar Asset Contract (SAC)
 *
 * Usage (from the repo root):
 *   node scripts/init.mjs
 *
 * Env overrides:
 *   CONTRACT_ID  — contract to initialize (defaults to the deployed one)
 *   RPC_URL      — Soroban RPC endpoint (defaults to testnet)
 */
import { createRequire } from "node:module";

// Dependencies are installed in client/ — resolve them from there.
const require = createRequire(new URL("../client/package.json", import.meta.url));
const {
  Keypair,
  Asset,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  rpc,
  Contract,
  nativeToScVal,
  Address,
} = require("@stellar/stellar-sdk");

const RPC_URL = process.env.RPC_URL ?? "https://soroban-testnet.stellar.org";
const CONTRACT_ID =
  process.env.CONTRACT_ID ?? "CAEFU3SKK7E5H7DXAMNZ62KV3OWHS4E3XZOJLDUMSM2KHYQ5ZIBGLHFR";
const PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);

// Native XLM Stellar Asset Contract address on testnet
const NATIVE_TOKEN = Asset.native().contractId(PASSPHRASE);
console.log("Native XLM SAC:", NATIVE_TOKEN);

// 1. Fund a throwaway key
const kp = Keypair.random();
console.log("Funding throwaway key via Friendbot:", kp.publicKey());
const fb = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
if (!fb.ok) throw new Error(`Friendbot failed: ${fb.status} ${await fb.text()}`);

// 2. Call initialize(token)
const account = await server.getAccount(kp.publicKey());
const contract = new Contract(CONTRACT_ID);

const tx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: PASSPHRASE,
})
  .addOperation(
    contract.call("initialize", nativeToScVal(new Address(NATIVE_TOKEN), { type: "address" })),
  )
  .setTimeout(60)
  .build();

const sim = await server.simulateTransaction(tx);
if (rpc.Api.isSimulationError(sim)) {
  if (sim.error.includes("#2") || sim.error.includes("AlreadyInitialized")) {
    console.log("✅ Contract is already initialized — nothing to do.");
    process.exit(0);
  }
  throw new Error(`Simulation failed: ${sim.error}`);
}

const prepared = rpc.assembleTransaction(tx, sim).build();
prepared.sign(kp);

const sent = await server.sendTransaction(prepared);
if (sent.status === "ERROR") {
  throw new Error(`Send failed: ${JSON.stringify(sent.errorResult)}`);
}
console.log("Sent:", sent.hash, "— waiting for confirmation…");

let result = await server.getTransaction(sent.hash);
for (let i = 0; i < 30 && result.status === "NOT_FOUND"; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  result = await server.getTransaction(sent.hash);
}

if (result.status !== "SUCCESS") {
  throw new Error(`Transaction ${result.status}: ${JSON.stringify(result)}`);
}
console.log("✅ Contract initialized with native XLM token!");
console.log("   Tx: https://stellar.expert/explorer/testnet/tx/" + sent.hash);
