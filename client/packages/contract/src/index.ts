import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAEFU3SKK7E5H7DXAMNZ62KV3OWHS4E3XZOJLDUMSM2KHYQ5ZIBGLHFR",
  }
} as const


export interface Loan {
  apr_bps: u32;
  borrower: string;
  created_at: u64;
  deadline: u64;
  funded: i128;
  id: u64;
  principal: i128;
  repaid: i128;
  status: LoanStatus;
  term_secs: u64;
}

export const Errors = {
  1: {message:"NotFound"},
  2: {message:"AlreadyInitialized"},
  3: {message:"NotOpenForFunding"},
  4: {message:"Overfund"},
  5: {message:"NotRepayable"},
  6: {message:"OnlyBorrower"},
  7: {message:"ExceedsAmountDue"},
  8: {message:"NotActive"},
  9: {message:"NotDefaultedYet"},
  10: {message:"NothingToWithdraw"}
}

export type DataKey = {tag: "Token", values: void} | {tag: "Pool", values: void} | {tag: "Count", values: void} | {tag: "Loan", values: readonly [u64]} | {tag: "Contribs", values: readonly [u64]} | {tag: "Claims", values: readonly [u64]} | {tag: "Stats", values: readonly [string]};


export interface UserStats {
  defaults: u32;
  loans_taken: u32;
  repaid_late: u32;
  repaid_on_time: u32;
}

export type LoanStatus = {tag: "Pending", values: void} | {tag: "Active", values: void} | {tag: "Repaid", values: void} | {tag: "Defaulted", values: void};

export interface Client {
  /**
   * Construct and simulate a repay transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Repay principal + interest. Partial repayments accumulate.
   */
  repay: ({borrower, loan_id, amount}: {borrower: string, loan_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_loan: ({loan_id}: {loan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Loan>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw a lender's payout after a loan is Repaid or Defaulted.
   */
  withdraw: ({lender, loan_id}: {lender: string, loan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a claimable transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claimable: ({lender, loan_id}: {lender: string, loan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a fund_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Fund part of a pending loan from the lender's wallet into escrow.
   * When fully funded the principal is disbursed to the borrower.
   */
  fund_loan: ({lender, loan_id, amount}: {lender: string, loan_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the token used for lending. Callable once, by anyone (deployer).
   */
  initialize: ({token}: {token: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a user_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  user_stats: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<UserStats>>

  /**
   * Construct and simulate a loans_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  loans_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a credit_score transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  credit_score: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i64>>

  /**
   * Construct and simulate a deposit_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposit funds into the default-insurance pool.
   */
  deposit_pool: ({depositor, amount}: {depositor: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a mark_default transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Anyone may trigger a default once a fully-funded loan is past its
   * deadline and not fully repaid. The insurance pool covers the shortfall.
   */
  mark_default: ({loan_id}: {loan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a pool_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pool_balance: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a request_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a loan request. Returns the new loan id.
   */
  request_loan: ({borrower, amount, term_secs, apr_bps}: {borrower: string, amount: i128, term_secs: u64, apr_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a loan_contributions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  loan_contributions: ({loan_id}: {loan_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, i128>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABExvYW4AAAAKAAAAAAAAAAdhcHJfYnBzAAAAAAQAAAAAAAAACGJvcnJvd2VyAAAAEwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAAAAAAZmdW5kZWQAAAAAAAsAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAlwcmluY2lwYWwAAAAAAAALAAAAAAAAAAZyZXBhaWQAAAAAAAsAAAAAAAAABnN0YXR1cwAAAAAH0AAAAApMb2FuU3RhdHVzAAAAAAAAAAAACXRlcm1fc2VjcwAAAAAAAAY=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACgAAAAAAAAAITm90Rm91bmQAAAABAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAAEU5vdE9wZW5Gb3JGdW5kaW5nAAAAAAAAAwAAAAAAAAAIT3ZlcmZ1bmQAAAAEAAAAAAAAAAxOb3RSZXBheWFibGUAAAAFAAAAAAAAAAxPbmx5Qm9ycm93ZXIAAAAGAAAAAAAAABBFeGNlZWRzQW1vdW50RHVlAAAABwAAAAAAAAAJTm90QWN0aXZlAAAAAAAACAAAAAAAAAAPTm90RGVmYXVsdGVkWWV0AAAAAAkAAAAAAAAAEU5vdGhpbmdUb1dpdGhkcmF3AAAAAAAACg==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABwAAAAAAAAAAAAAABVRva2VuAAAAAAAAAAAAAAAAAAAEUG9vbAAAAAAAAAAAAAAABUNvdW50AAAAAAAAAQAAAAAAAAAETG9hbgAAAAEAAAAGAAAAAQAAAAAAAAAIQ29udHJpYnMAAAABAAAABgAAAAEAAAAAAAAABkNsYWltcwAAAAAAAQAAAAYAAAABAAAAAAAAAAVTdGF0cwAAAAAAAAEAAAAT",
        "AAAAAQAAAAAAAAAAAAAACVVzZXJTdGF0cwAAAAAAAAQAAAAAAAAACGRlZmF1bHRzAAAABAAAAAAAAAALbG9hbnNfdGFrZW4AAAAABAAAAAAAAAALcmVwYWlkX2xhdGUAAAAABAAAAAAAAAAOcmVwYWlkX29uX3RpbWUAAAAAAAQ=",
        "AAAAAgAAAAAAAAAAAAAACkxvYW5TdGF0dXMAAAAAAAQAAAAAAAAAAAAAAAdQZW5kaW5nAAAAAAAAAAAAAAAABkFjdGl2ZQAAAAAAAAAAAAAAAAAGUmVwYWlkAAAAAAAAAAAAAAAAAAlEZWZhdWx0ZWQAAAA=",
        "AAAAAAAAADpSZXBheSBwcmluY2lwYWwgKyBpbnRlcmVzdC4gUGFydGlhbCByZXBheW1lbnRzIGFjY3VtdWxhdGUuAAAAAAAFcmVwYXkAAAAAAAADAAAAAAAAAAhib3Jyb3dlcgAAABMAAAAAAAAAB2xvYW5faWQAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAAIZ2V0X2xvYW4AAAABAAAAAAAAAAdsb2FuX2lkAAAAAAYAAAABAAAH0AAAAARMb2Fu",
        "AAAAAAAAAD9XaXRoZHJhdyBhIGxlbmRlcidzIHBheW91dCBhZnRlciBhIGxvYW4gaXMgUmVwYWlkIG9yIERlZmF1bHRlZC4AAAAACHdpdGhkcmF3AAAAAgAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAAAAAAdsb2FuX2lkAAAAAAYAAAABAAAACw==",
        "AAAAAAAAAAAAAAAJY2xhaW1hYmxlAAAAAAAAAgAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAAAAAAdsb2FuX2lkAAAAAAYAAAABAAAACw==",
        "AAAAAAAAAH9GdW5kIHBhcnQgb2YgYSBwZW5kaW5nIGxvYW4gZnJvbSB0aGUgbGVuZGVyJ3Mgd2FsbGV0IGludG8gZXNjcm93LgpXaGVuIGZ1bGx5IGZ1bmRlZCB0aGUgcHJpbmNpcGFsIGlzIGRpc2J1cnNlZCB0byB0aGUgYm9ycm93ZXIuAAAAAAlmdW5kX2xvYW4AAAAAAAADAAAAAAAAAAZsZW5kZXIAAAAAABMAAAAAAAAAB2xvYW5faWQAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAERTZXQgdGhlIHRva2VuIHVzZWQgZm9yIGxlbmRpbmcuIENhbGxhYmxlIG9uY2UsIGJ5IGFueW9uZSAoZGVwbG95ZXIpLgAAAAppbml0aWFsaXplAAAAAAABAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAKdXNlcl9zdGF0cwAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAH0AAAAAlVc2VyU3RhdHMAAAA=",
        "AAAAAAAAAAAAAAALbG9hbnNfY291bnQAAAAAAAAAAAEAAAAG",
        "AAAAAAAAAAAAAAAMY3JlZGl0X3Njb3JlAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAABw==",
        "AAAAAAAAAC5EZXBvc2l0IGZ1bmRzIGludG8gdGhlIGRlZmF1bHQtaW5zdXJhbmNlIHBvb2wuAAAAAAAMZGVwb3NpdF9wb29sAAAAAgAAAAAAAAAJZGVwb3NpdG9yAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAIlBbnlvbmUgbWF5IHRyaWdnZXIgYSBkZWZhdWx0IG9uY2UgYSBmdWxseS1mdW5kZWQgbG9hbiBpcyBwYXN0IGl0cwpkZWFkbGluZSBhbmQgbm90IGZ1bGx5IHJlcGFpZC4gVGhlIGluc3VyYW5jZSBwb29sIGNvdmVycyB0aGUgc2hvcnRmYWxsLgAAAAAAAAxtYXJrX2RlZmF1bHQAAAABAAAAAAAAAAdsb2FuX2lkAAAAAAYAAAAA",
        "AAAAAAAAAAAAAAAMcG9vbF9iYWxhbmNlAAAAAAAAAAEAAAAL",
        "AAAAAAAAAC9DcmVhdGUgYSBsb2FuIHJlcXVlc3QuIFJldHVybnMgdGhlIG5ldyBsb2FuIGlkLgAAAAAMcmVxdWVzdF9sb2FuAAAABAAAAAAAAAAIYm9ycm93ZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAACXRlcm1fc2VjcwAAAAAAAAYAAAAAAAAAB2Fwcl9icHMAAAAABAAAAAEAAAAG",
        "AAAAAAAAAAAAAAASbG9hbl9jb250cmlidXRpb25zAAAAAAABAAAAAAAAAAdsb2FuX2lkAAAAAAYAAAABAAAD7AAAABMAAAAL" ]),
      options
    )
  }
  public readonly fromJSON = {
    repay: this.txFromJSON<null>,
        get_loan: this.txFromJSON<Loan>,
        withdraw: this.txFromJSON<i128>,
        claimable: this.txFromJSON<i128>,
        fund_loan: this.txFromJSON<null>,
        initialize: this.txFromJSON<null>,
        user_stats: this.txFromJSON<UserStats>,
        loans_count: this.txFromJSON<u64>,
        credit_score: this.txFromJSON<i64>,
        deposit_pool: this.txFromJSON<null>,
        mark_default: this.txFromJSON<null>,
        pool_balance: this.txFromJSON<i128>,
        request_loan: this.txFromJSON<u64>,
        loan_contributions: this.txFromJSON<Map<string, i128>>
  }
}