#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _, StellarAssetContract};
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{symbol_short, Env, Symbol, TryFromVal};

fn xlm(n: i128) -> i128 {
    n * 10_000_000
}

struct Setup {
    env: Env,
    token: Address,
    contract_id: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac: StellarAssetContract = env.register_stellar_asset_contract_v2(admin);
    let token = sac.address();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.initialize(&token);
    Setup { env, token, contract_id }
}

impl Setup {
    fn token_client(&self) -> TokenClient<'_> {
        TokenClient::new(&self.env, &self.token)
    }
    fn mint(&self, to: &Address, amount: &i128) {
        StellarAssetClient::new(&self.env, &self.token).mint(to, amount);
    }
    fn client(&self) -> ContractClient<'_> {
        ContractClient::new(&self.env, &self.contract_id)
    }
}

#[test]
fn test_initialize_defaults() {
    let s = setup();
    assert_eq!(s.client().pool_balance(), 0);
    assert_eq!(s.client().loans_count(), 0);
    let stranger = Address::generate(&s.env);
    assert_eq!(s.client().credit_score(&stranger), 600);
    assert_eq!(s.token_client().balance(&s.contract_id), 0);
}

#[test]
fn test_request_loan_and_getters() {
    let s = setup();
    let borrower = Address::generate(&s.env);

    let id = s.client().request_loan(
        &borrower,
        &xlm(1_000),
        &(30 * 24 * 3600),
        &1200u32,
    );
    assert_eq!(id, 0);
    assert_eq!(s.client().loans_count(), 1);

    let loan = s.client().get_loan(&0);
    assert_eq!(loan.borrower, borrower);
    assert_eq!(loan.principal, xlm(1_000));
    assert_eq!(loan.funded, 0);
    assert_eq!(loan.repaid, 0);
    assert_eq!(loan.apr_bps, 1200);
    assert_eq!(loan.status, LoanStatus::Pending);
    assert_eq!(loan.deadline, 0);

    let id2 = s.client().request_loan(&borrower, &xlm(500), &(10 * 24 * 3600), &500u32);
    assert_eq!(id2, 1);
    assert_eq!(s.client().loans_count(), 2);
}

#[test]
fn test_fund_partial_then_full_disburses_to_borrower() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));

    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);

    // Partial funding stays in escrow
    s.client().fund_loan(&lender, &0, &xlm(400));
    assert_eq!(s.token_client().balance(&s.contract_id), xlm(400));
    let loan = s.client().get_loan(&0);
    assert_eq!(loan.status, LoanStatus::Pending);
    assert_eq!(loan.funded, xlm(400));

    // Full funding disburses principal to borrower and activates the loan
    let ts = s.env.ledger().timestamp();
    s.client().fund_loan(&lender, &0, &xlm(600));
    assert_eq!(s.token_client().balance(&borrower), xlm(1_000));
    assert_eq!(s.token_client().balance(&s.contract_id), 0);

    let loan = s.client().get_loan(&0);
    assert_eq!(loan.status, LoanStatus::Active);
    assert_eq!(loan.funded, xlm(1_000));
    assert_eq!(loan.deadline, ts + 30 * 24 * 3600);

    let contribs = s.client().loan_contributions(&0);
    assert_eq!(contribs.get(lender.clone()).unwrap(), xlm(1_000));
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_overfund_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_200));
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_fund_non_pending_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));
    // Already fully funded (Active) — further funding rejected
    s.client().fund_loan(&lender, &0, &xlm(100));
}

#[test]
fn test_repay_with_interest_and_proportional_withdrawal() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    s.mint(&alice, &xlm(700));
    s.mint(&bob, &xlm(400));
    s.mint(&borrower, &xlm(2_000));

    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&alice, &0, &xlm(600)); // 60%
    s.client().fund_loan(&bob, &0, &xlm(400)); // 40%

    // total due = 1000 + 12% = 1120 XLM
    let due = xlm(1_000) + xlm(1_000) * 1200 / 10000;
    assert_eq!(due, xlm(1_120));

    s.client().repay(&borrower, &0, &due);
    assert_eq!(s.token_client().balance(&s.contract_id), due);

    let loan = s.client().get_loan(&0);
    assert_eq!(loan.status, LoanStatus::Repaid);

    // Alice claim: 60% of 1120 = 672 ; Bob: 40% of 1120 = 448
    assert_eq!(s.client().claimable(&alice, &0), xlm(672));
    assert_eq!(s.client().claimable(&bob, &0), xlm(448));

    let got_alice = s.client().withdraw(&alice, &0);
    assert_eq!(got_alice, xlm(672));
    assert_eq!(s.token_client().balance(&alice), xlm(772)); // 700 - 600 funded + 672
    assert_eq!(s.client().claimable(&alice, &0), 0);

    s.client().withdraw(&bob, &0);
    assert_eq!(s.token_client().balance(&bob), xlm(448));
    assert_eq!(s.token_client().balance(&s.contract_id), 0);

    // Credit stats: one on-time repayment
    let stats = s.client().user_stats(&borrower);
    assert_eq!(stats.repaid_on_time, 1);
    assert_eq!(stats.repaid_late, 0);
    assert_eq!(stats.defaults, 0);
    assert_eq!(s.client().credit_score(&borrower), 700); // 600 + 100

    // Withdraw with nothing left errors
    let res = s.client().try_withdraw(&alice, &0);
    assert!(res.is_err());
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_repay_wrong_caller_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let other = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));
    s.client().repay(&other, &0, &xlm(100));
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_overrepay_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.mint(&borrower, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));
    s.client().repay(&borrower, &0, &xlm(1_130));
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_repay_pending_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    s.mint(&borrower, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().repay(&borrower, &0, &xlm(100));
}

#[test]
fn test_partial_repay_accumulates() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.mint(&borrower, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));

    s.client().repay(&borrower, &0, &xlm(300));
    assert_eq!(s.client().get_loan(&0).status, LoanStatus::Active);
    assert_eq!(s.client().get_loan(&0).repaid, xlm(300));

    s.client().repay(&borrower, &0, &xlm(820));
    assert_eq!(s.client().get_loan(&0).status, LoanStatus::Repaid);
    // Only 1120 taken even though 300 + 900 was offered
    assert_eq!(s.token_client().balance(&s.contract_id), xlm(1_120));
    // 5000 minted + 1000 disbursed - 1120 repaid
    assert_eq!(s.token_client().balance(&borrower), xlm(4_880));

    // Lenders can withdraw after partial-then-full repayment
    assert_eq!(s.client().claimable(&lender, &0), xlm(1_120));
}

#[test]
fn test_late_repayment_marks_late() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.mint(&borrower, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &100u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));

    // Jump past deadline
    s.env.ledger().with_mut(|li| li.timestamp += 31 * 24 * 3600);
    let due = xlm(1_000) + xlm(1_000) * 100 / 10000;
    s.client().repay(&borrower, &0, &due);

    let stats = s.client().user_stats(&borrower);
    assert_eq!(stats.repaid_late, 1);
    assert_eq!(stats.repaid_on_time, 0);
    assert_eq!(s.client().credit_score(&borrower), 550); // 600 - 50
}

#[test]
fn test_default_pool_covers_lenders() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    let pool_staker = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.mint(&pool_staker, &xlm(5_000));
    s.mint(&borrower, &xlm(1_000));

    s.client().deposit_pool(&pool_staker, &xlm(2_000));
    assert_eq!(s.client().pool_balance(), xlm(2_000));

    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));

    // Borrower repays 400 of 1120 then goes silent past the deadline
    s.client().repay(&borrower, &0, &xlm(400));
    s.env.ledger().with_mut(|li| li.timestamp += 31 * 24 * 3600);

    s.client().mark_default(&0);
    let loan = s.client().get_loan(&0);
    assert_eq!(loan.status, LoanStatus::Defaulted);

    // Pool covered shortfall: 1120 - 400 = 720. Pool left: 1280
    assert_eq!(s.client().pool_balance(), xlm(1_280));
    // Lender made whole on total due
    assert_eq!(s.client().claimable(&lender, &0), xlm(1_120));
    s.client().withdraw(&lender, &0);
    assert_eq!(s.token_client().balance(&lender), xlm(5_120)); // 5000 - 1000 funded + 1120 payout
    // Contract escrow still holds the remaining insurance pool funds
    assert_eq!(s.token_client().balance(&s.contract_id), s.client().pool_balance());
    assert_eq!(s.client().pool_balance(), xlm(1_280));

    let stats = s.client().user_stats(&borrower);
    assert_eq!(stats.defaults, 1);
    assert_eq!(s.client().credit_score(&borrower), 450); // 600 - 150

    // Pool depositor balance reflects the coverage payout
    assert_eq!(s.token_client().balance(&pool_staker), xlm(3_000)); // minted 5000 - deposited 2000
}

#[test]
fn test_default_without_pool_partial_payout() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    s.mint(&alice, &xlm(700));
    s.mint(&bob, &xlm(400));

    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&alice, &0, &xlm(600));
    s.client().fund_loan(&bob, &0, &xlm(400));

    // No repayment at all and no pool funds — lenders get nothing
    s.env.ledger().with_mut(|li| li.timestamp += 31 * 24 * 3600);
    s.client().mark_default(&0);

    assert_eq!(s.client().claimable(&alice, &0), 0);
    assert_eq!(s.client().claimable(&bob, &0), 0);
    assert_eq!(s.client().user_stats(&borrower).defaults, 1);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_mark_default_before_deadline_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));
    s.client().mark_default(&0);
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_mark_default_twice_rejected() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));
    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &0, &xlm(1_000));
    s.env.ledger().with_mut(|li| li.timestamp += 31 * 24 * 3600);
    s.client().mark_default(&0);
    s.client().mark_default(&0);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_missing_loan_panics() {
    let s = setup();
    s.client().get_loan(&99);
}

#[test]
fn test_credit_score_progression() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(50_000));
    s.mint(&borrower, &xlm(50_000));

    assert_eq!(s.client().credit_score(&borrower), 600);

    // Two successful loans → 600 + 200 = 800
    for _ in 0..2 {
        let id = s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
        s.client().fund_loan(&lender, &id, &xlm(1_000));
        let due = xlm(1_000) + xlm(1_000) * 1200 / 10000;
        s.client().repay(&borrower, &id, &due);
    }
    assert_eq!(s.client().credit_score(&borrower), 800);

    // Third loan defaults (no pool) → 800 - 150 = 650
    let id = s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    s.client().fund_loan(&lender, &id, &xlm(1_000));
    s.env.ledger().with_mut(|li| li.timestamp += 31 * 24 * 3600);
    s.client().mark_default(&id);
    assert_eq!(s.client().credit_score(&borrower), 650);
}

#[test]
fn test_events_emitted() {
    let s = setup();
    let borrower = Address::generate(&s.env);
    let lender = Address::generate(&s.env);
    s.mint(&lender, &xlm(5_000));

    // NOTE: the host clears its event buffer on every top-level invocation,
    // so we capture topics immediately after each contract call.
    let topic_names = |s: &Setup| -> soroban_sdk::Vec<Symbol> {
        let mut names = soroban_sdk::Vec::<Symbol>::new(&s.env);
        for e in s.env.events().all().filter_by_contract(&s.contract_id).events() {
            if let soroban_sdk::xdr::ContractEventBody::V0(body) = &e.body {
                if let Some(first) = body.topics.first() {
                    if let Ok(sym) = Symbol::try_from_val(&s.env, first) {
                        names.push_back(sym);
                    }
                }
            }
        }
        names
    };

    s.client().request_loan(&borrower, &xlm(1_000), &(30 * 24 * 3600), &1200u32);
    assert!(topic_names(&s).contains(&symbol_short!("loan_req")));

    s.client().fund_loan(&lender, &0, &xlm(1_000));
    assert!(topic_names(&s).contains(&symbol_short!("funded")));

    s.client().deposit_pool(&lender, &xlm(50));
    assert!(topic_names(&s).contains(&symbol_short!("pool_dep")));
}

