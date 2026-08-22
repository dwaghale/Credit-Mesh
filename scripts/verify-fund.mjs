/**
 * Verifies fund_loan simulates cleanly against the deployed contract
 * (this is exactly what the UI does before asking the wallet to sign).
 *
 * Usage: node scripts/verify-fund.mjs [lender-G-address] [loan-id] [xlm]
 */
import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  rpc,
  Contract,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const CONTRACT_ID =
  process.env.CONTRACT_ID ?? "CAEFU3SKK7E5H7DXAMNZ62KV3OWHS4E3XZOJLDUMSM2KHYQ5ZIBGLHFR";

const server = new rpc.Server(RPC_URL);

// Use any funded account as the simulated lender source
let lender = process.argv[2];
if (!lender) {
  const kp = Keypair.random();
  await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
  lender = kp.publicKey();
  console.log("Using freshly funded lender:", lender);
}
const loanId = BigInt(process.argv[3] ?? 0);
const stroops = BigInt(Math.round(Number(process.argv[4] ?? 24) * 10_000_000));

const account = await server.getAccount(lender);
const contract = new Contract(CONTRACT_ID);

const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(
    contract.call(
      "fund_loan",
      nativeToScVal(new Address(lender), { type: "address" }),
      nativeToScVal(loanId, { type: "u64" }),
      nativeToScVal(stroops, { type: "i128" }),
    ),
  )
  .setTimeout(60)
  .build();

const sim = await server.simulateTransaction(tx);
if (rpc.Api.isSimulationError(sim)) {
  console.error("❌ Simulation still fails:", sim.error);
  process.exit(1);
}
console.log(`✅ fund_loan(loan_id=${loanId}, amount=${stroops} stroops) simulates successfully!`);
