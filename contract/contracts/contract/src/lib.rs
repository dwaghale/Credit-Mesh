#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short,
    token::Client as TokenClient, Address, Env, Map,
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    NotFound = 1,
    AlreadyInitialized = 2,
    NotOpenForFunding = 3,
    Overfund = 4,
    NotRepayable = 5,
    OnlyBorrower = 6,
    ExceedsAmountDue = 7,
    NotActive = 8,
    NotDefaultedYet = 9,
    NothingToWithdraw = 10,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Pending,
    Active,
    Repaid,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub id: u64,
    pub borrower: Address,
    pub principal: i128,
    pub funded: i128,
    pub repaid: i128,
    pub apr_bps: u32,
    pub term_secs: u64,
    pub created_at: u64,
    pub deadline: u64,
    pub status: LoanStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    pub loans_taken: u32,
    pub repaid_on_time: u32,
    pub repaid_late: u32,
    pub defaults: u32,
}

impl Default for UserStats {
    fn default() -> Self {
        Self { loans_taken: 0, repaid_on_time: 0, repaid_late: 0, defaults: 0 }
    }
}

#[contracttype]
pub enum DataKey {
    Token,
    Pool,
    Count,
    Loan(u64),
    Contribs(u64),
    Claims(u64),
    Stats(Address),
}

/// On-chain credit score: starts at 600; +100 per on-time repayment (max +300),
/// -50 per late repayment, -150 per default (max -300). Clamped to [300, 900].
const BASE_SCORE: i64 = 600;
const SCORE_MIN: i64 = 300;
const SCORE_MAX: i64 = 900;

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Set the token used for lending. Callable once, by anyone (deployer).
    pub fn initialize(env: Env, token: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Pool, &0i128);
        env.storage().instance().set(&DataKey::Count, &0u64);
    }

    // -- Borrower -----------------------------------------------------------

    /// Create a loan request. Returns the new loan id.
    pub fn request_loan(env: Env, borrower: Address, amount: i128, term_secs: u64, apr_bps: u32) -> u64 {
        borrower.require_auth();
        assert!(amount > 0, "amount must be positive");
        assert!(term_secs > 0, "term must be positive");
        assert!(apr_bps > 0 && apr_bps <= 10000, "apr out of range");

        let id: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        env.storage().instance().set(&DataKey::Count, &(id + 1));

        let loan = Loan {
            id,
            borrower: borrower.clone(),
            principal: amount,
            funded: 0,
            repaid: 0,
            apr_bps,
            term_secs,
            created_at: env.ledger().timestamp(),
            deadline: 0,
            status: LoanStatus::Pending,
        };
        env.storage().persistent().set(&DataKey::Loan(id), &loan);
        env.storage().persistent().set(&DataKey::Contribs(id), &Map::<Address, i128>::new(&env));
        env.storage().persistent().set(&DataKey::Claims(id), &Map::<Address, i128>::new(&env));
        Self::bump_stats(&env, &borrower, |s| s.loans_taken += 1);
        env.storage().persistent().extend_ttl(&DataKey::Loan(id), 100, 172_800);

        env.events().publish(
            (symbol_short!("loan_req"),),
            (borrower, id, amount, apr_bps),
        );
        id
    }

    // -- Lender -------------------------------------------------------------

    /// Fund part of a pending loan from the lender's wallet into escrow.
    /// When fully funded the principal is disbursed to the borrower.
    pub fn fund_loan(env: Env, lender: Address, loan_id: u64, amount: i128) {
        lender.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut loan = Self::get_loan(env.clone(), loan_id);
        if loan.status != LoanStatus::Pending {
            panic_with_error!(&env, Error::NotOpenForFunding);
        }
        let remaining = loan.principal - loan.funded;
        if amount > remaining {
            panic_with_error!(&env, Error::Overfund);
        }

        let token = TokenClient::new(&env, &Self::token(&env));
        token.transfer(&lender, &env.current_contract_address(), &amount);

        let mut contribs = Self::contribs(&env, loan_id);
        let prev = contribs.get(lender.clone()).unwrap_or(0);
        contribs.set(lender.clone(), prev + amount);
        env.storage().persistent().set(&DataKey::Contribs(loan_id), &contribs);

        loan.funded += amount;
        if loan.funded == loan.principal {
            // Fully funded: activate and disburse to borrower
            loan.status = LoanStatus::Active;
            loan.deadline = env.ledger().timestamp() + loan.term_secs;
            token.transfer(&env.current_contract_address(), &loan.borrower, &loan.principal);
        }
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
        env.storage().persistent().extend_ttl(&DataKey::Contribs(loan_id), 100, 172_800);

        env.events().publish((symbol_short!("funded"),), (lender, loan_id, amount));
    }

    /// Withdraw a lender's payout after a loan is Repaid or Defaulted.
    pub fn withdraw(env: Env, lender: Address, loan_id: u64) -> i128 {
        lender.require_auth();
        let mut claims = Self::claims(&env, loan_id);
        let claim = claims.get(lender.clone()).unwrap_or(0);
        if claim == 0 {
            panic_with_error!(&env, Error::NothingToWithdraw);
        }
        claims.set(lender.clone(), 0);
        env.storage().persistent().set(&DataKey::Claims(loan_id), &claims);

        let token = TokenClient::new(&env, &Self::token(&env));
        token.transfer(&env.current_contract_address(), &lender, &claim);

        env.events().publish((symbol_short!("withdrew"),), (lender, loan_id, claim));
        claim
    }

    // -- Borrower repayment ---------------------------------------------------

    /// Repay principal + interest. Partial repayments accumulate.
    pub fn repay(env: Env, borrower: Address, loan_id: u64, amount: i128) {
        borrower.require_auth();
        let mut loan = Self::get_loan(env.clone(), loan_id);
        if loan.status != LoanStatus::Active {
            panic_with_error!(&env, Error::NotRepayable);
        }
        if borrower != loan.borrower {
            panic_with_error!(&env, Error::OnlyBorrower);
        }
        let due = Self::total_due(&loan);
        let remaining = due - loan.repaid;
        if amount > remaining {
            panic_with_error!(&env, Error::ExceedsAmountDue);
        }

        let token = TokenClient::new(&env, &Self::token(&env));
        token.transfer(&borrower, &env.current_contract_address(), &amount);
        loan.repaid += amount;

        if loan.repaid == due {
            loan.status = LoanStatus::Repaid;
            Self::settle_claims(&env, &loan, due);
            let on_time = env.ledger().timestamp() <= loan.deadline;
            Self::bump_stats(&env, &borrower, |s| {
                if on_time { s.repaid_on_time += 1 } else { s.repaid_late += 1 }
            });
            env.events().publish((symbol_short!("repaid"),), (borrower, loan_id, due));
        }
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
    }

    // -- Insurance pool -------------------------------------------------------

    /// Deposit funds into the default-insurance pool.
    pub fn deposit_pool(env: Env, depositor: Address, amount: i128) {
        depositor.require_auth();
        assert!(amount > 0, "amount must be positive");
        let token = TokenClient::new(&env, &Self::token(&env));
        token.transfer(&depositor, &env.current_contract_address(), &amount);
        let pool: i128 = env.storage().instance().get(&DataKey::Pool).unwrap_or(0);
        env.storage().instance().set(&DataKey::Pool, &(pool + amount));
        env.storage().instance().extend_ttl(100, 172_800);
        env.events().publish((symbol_short!("pool_dep"),), (depositor, amount));
    }

    /// Anyone may trigger a default once a fully-funded loan is past its
    /// deadline and not fully repaid. The insurance pool covers the shortfall.
    pub fn mark_default(env: Env, loan_id: u64) {
        let mut loan = Self::get_loan(env.clone(), loan_id);
        if loan.status != LoanStatus::Active {
            panic_with_error!(&env, Error::NotActive);
        }
        if env.ledger().timestamp() <= loan.deadline {
            panic_with_error!(&env, Error::NotDefaultedYet);
        }

        loan.status = LoanStatus::Defaulted;
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);

        let due = Self::total_due(&loan);
        let shortfall = due - loan.repaid;
        let pool: i128 = env.storage().instance().get(&DataKey::Pool).unwrap_or(0);
        let topup = shortfall.min(pool);
        env.storage().instance().set(&DataKey::Pool, &(pool - topup));
        Self::settle_claims(&env, &loan, loan.repaid + topup);
        Self::bump_stats(&env, &loan.borrower, |s| s.defaults += 1);

        env.events().publish(
            (symbol_short!("default"),),
            (loan_id, loan.borrower.clone(), loan.repaid, topup),
        );
    }

    // -- Getters --------------------------------------------------------------

    pub fn get_loan(env: Env, loan_id: u64) -> Loan {
        env.storage()
            .persistent()
            .get(&DataKey::Loan(loan_id))
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotFound))
    }

    pub fn loans_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Count).unwrap_or(0)
    }

    pub fn loan_contributions(env: Env, loan_id: u64) -> Map<Address, i128> {
        Self::contribs(&env, loan_id)
    }

    pub fn claimable(env: Env, lender: Address, loan_id: u64) -> i128 {
        Self::claims(&env, loan_id).get(lender).unwrap_or(0)
    }

    pub fn pool_balance(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Pool).unwrap_or(0)
    }

    pub fn user_stats(env: Env, user: Address) -> UserStats {
        env.storage().persistent().get(&DataKey::Stats(user)).unwrap_or_default()
    }

    pub fn credit_score(env: Env, user: Address) -> i64 {
        let s = Self::user_stats(env, user);
        let bonus = ((s.repaid_on_time as i64) * 100).min(300);
        let penalty = ((s.defaults as i64) * 150).min(300) + (s.repaid_late as i64) * 50;
        (BASE_SCORE + bonus - penalty).clamp(SCORE_MIN, SCORE_MAX)
    }

    // -- Internals (not exported) ----------------------------------------------

    fn token(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Token).expect("not initialized")
    }

    fn total_due(loan: &Loan) -> i128 {
        loan.principal + loan.principal * (loan.apr_bps as i128) / 10000
    }

    fn contribs(env: &Env, loan_id: u64) -> Map<Address, i128> {
        env.storage().persistent().get(&DataKey::Contribs(loan_id)).unwrap()
    }

    fn claims(env: &Env, loan_id: u64) -> Map<Address, i128> {
        env.storage().persistent().get(&DataKey::Claims(loan_id)).unwrap()
    }

    /// Distribute `payout` among lenders pro-rata to their contributions.
    fn settle_claims(env: &Env, loan: &Loan, payout: i128) {
        let contribs = Self::contribs(env, loan.id);
        let mut claims: Map<Address, i128> = Map::new(env);
        for addr in contribs.keys() {
            let c = contribs.get(addr.clone()).unwrap_or(0);
            if c > 0 {
                claims.set(addr.clone(), c * payout / loan.principal);
            }
        }
        env.storage().persistent().set(&DataKey::Claims(loan.id), &claims);
    }

    fn bump_stats(env: &Env, user: &Address, f: impl FnOnce(&mut UserStats)) {
        let mut stats: UserStats =
            env.storage().persistent().get(&DataKey::Stats(user.clone())).unwrap_or_default();
        f(&mut stats);
        env.storage().persistent().set(&DataKey::Stats(user.clone()), &stats);
    }
}

mod test;
