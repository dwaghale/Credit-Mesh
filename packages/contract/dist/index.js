import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
};
export const Errors = {
    1: { message: "NotFound" },
    2: { message: "AlreadyInitialized" },
    3: { message: "NotOpenForFunding" },
    4: { message: "Overfund" },
    5: { message: "NotRepayable" },
    6: { message: "OnlyBorrower" },
    7: { message: "ExceedsAmountDue" },
    8: { message: "NotActive" },
    9: { message: "NotDefaultedYet" },
    10: { message: "NothingToWithdraw" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAABExvYW4AAAAKAAAAAAAAAAdhcHJfYnBzAAAAAAQAAAAAAAAACGJvcnJvd2VyAAAAEwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAAAAAAZmdW5kZWQAAAAAAAsAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAlwcmluY2lwYWwAAAAAAAALAAAAAAAAAAZyZXBhaWQAAAAAAAsAAAAAAAAABnN0YXR1cwAAAAAH0AAAAApMb2FuU3RhdHVzAAAAAAAAAAAACXRlcm1fc2VjcwAAAAAAAAY=",
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
            "AAAAAAAAAAAAAAASbG9hbl9jb250cmlidXRpb25zAAAAAAABAAAAAAAAAAdsb2FuX2lkAAAAAAYAAAABAAAD7AAAABMAAAAL"]), options);
        this.options = options;
    }
    fromJSON = {
        repay: (this.txFromJSON),
        get_loan: (this.txFromJSON),
        withdraw: (this.txFromJSON),
        claimable: (this.txFromJSON),
        fund_loan: (this.txFromJSON),
        initialize: (this.txFromJSON),
        user_stats: (this.txFromJSON),
        loans_count: (this.txFromJSON),
        credit_score: (this.txFromJSON),
        deposit_pool: (this.txFromJSON),
        mark_default: (this.txFromJSON),
        pool_balance: (this.txFromJSON),
        request_loan: (this.txFromJSON),
        loan_contributions: (this.txFromJSON)
    };
}
