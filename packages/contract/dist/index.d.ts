import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i64, i128 } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CAEFU3SKK7E5H7DXAMNZ62KV3OWHS4E3XZOJLDUMSM2KHYQ5ZIBGLHFR";
    };
};
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
export declare const Errors: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
    3: {
        message: string;
    };
    4: {
        message: string;
    };
    5: {
        message: string;
    };
    6: {
        message: string;
    };
    7: {
        message: string;
    };
    8: {
        message: string;
    };
    9: {
        message: string;
    };
    10: {
        message: string;
    };
};
export type DataKey = {
    tag: "Token";
    values: void;
} | {
    tag: "Pool";
    values: void;
} | {
    tag: "Count";
    values: void;
} | {
    tag: "Loan";
    values: readonly [u64];
} | {
    tag: "Contribs";
    values: readonly [u64];
} | {
    tag: "Claims";
    values: readonly [u64];
} | {
    tag: "Stats";
    values: readonly [string];
};
export interface UserStats {
    defaults: u32;
    loans_taken: u32;
    repaid_late: u32;
    repaid_on_time: u32;
}
export type LoanStatus = {
    tag: "Pending";
    values: void;
} | {
    tag: "Active";
    values: void;
} | {
    tag: "Repaid";
    values: void;
} | {
    tag: "Defaulted";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a repay transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Repay principal + interest. Partial repayments accumulate.
     */
    repay: ({ borrower, loan_id, amount }: {
        borrower: string;
        loan_id: u64;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_loan: ({ loan_id }: {
        loan_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Loan>>;
    /**
     * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Withdraw a lender's payout after a loan is Repaid or Defaulted.
     */
    withdraw: ({ lender, loan_id }: {
        lender: string;
        loan_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a claimable transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    claimable: ({ lender, loan_id }: {
        lender: string;
        loan_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a fund_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Fund part of a pending loan from the lender's wallet into escrow.
     * When fully funded the principal is disbursed to the borrower.
     */
    fund_loan: ({ lender, loan_id, amount }: {
        lender: string;
        loan_id: u64;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Set the token used for lending. Callable once, by anyone (deployer).
     */
    initialize: ({ token }: {
        token: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a user_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    user_stats: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<UserStats>>;
    /**
     * Construct and simulate a loans_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    loans_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a credit_score transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    credit_score: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i64>>;
    /**
     * Construct and simulate a deposit_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Deposit funds into the default-insurance pool.
     */
    deposit_pool: ({ depositor, amount }: {
        depositor: string;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a mark_default transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Anyone may trigger a default once a fully-funded loan is past its
     * deadline and not fully repaid. The insurance pool covers the shortfall.
     */
    mark_default: ({ loan_id }: {
        loan_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a pool_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    pool_balance: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a request_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Create a loan request. Returns the new loan id.
     */
    request_loan: ({ borrower, amount, term_secs, apr_bps }: {
        borrower: string;
        amount: i128;
        term_secs: u64;
        apr_bps: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a loan_contributions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    loan_contributions: ({ loan_id }: {
        loan_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, i128>>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        repay: (json: string) => AssembledTransaction<null>;
        get_loan: (json: string) => AssembledTransaction<Loan>;
        withdraw: (json: string) => AssembledTransaction<bigint>;
        claimable: (json: string) => AssembledTransaction<bigint>;
        fund_loan: (json: string) => AssembledTransaction<null>;
        initialize: (json: string) => AssembledTransaction<null>;
        user_stats: (json: string) => AssembledTransaction<UserStats>;
        loans_count: (json: string) => AssembledTransaction<bigint>;
        credit_score: (json: string) => AssembledTransaction<bigint>;
        deposit_pool: (json: string) => AssembledTransaction<null>;
        mark_default: (json: string) => AssembledTransaction<null>;
        pool_balance: (json: string) => AssembledTransaction<bigint>;
        request_loan: (json: string) => AssembledTransaction<bigint>;
        loan_contributions: (json: string) => AssembledTransaction<Map<string, bigint>>;
    };
}
