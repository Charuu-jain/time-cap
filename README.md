# VaultPay — Level 4 Milestone Escrow on Stellar Soroban

> Trustless multi-sig milestone funding & payout protocol on Stellar Testnet powered by Soroban smart contracts, Freighter wallet authentication, and real-time on-chain transaction lifecycle management.

![VaultPay UI](ui_1.jpeg)

---

## 🏛️ Architecture & System Design

VaultPay extends the Time-Cap decentralized vault architecture into a production-grade **Milestone Escrow protocol (Level 4 Green Belt)**.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │               VaultPay Soroban Protocol                 │
                  └─────────────────────────────────────────────────────────┘
                                       │
     [ Sponsor ]                                                  [ Builder ]
          │                                                            │
  1. initialize_vault(id, builder, amount)                             │
          │                                                            │
  2. fund_vault(id) ─────────► [ Vault State: Funded ]                 │
                                       │                               │
                                       │ 3. submit_work(id, url) ◄─────┘
                                       │
                               [ Vault State: Submitted ]
                                       │
  4. approve_and_release(id) ──────────┤
  (or refund(id) if aborted)           │
                                       ▼
                             [ Vault State: Released ]
                                       │
                                       └──────────► Payout Transferred to Builder
```

### Milestone Escrow State Machine
- **`Created`**: Escrow parameters initialized (sponsor, builder, token, amount, milestone ID).
- **`Funded`**: Sponsor deposits tokens into contract escrow via SAC token client.
- **`Submitted`**: Builder marks milestone as complete and provides verified deliverable proof URI.
- **`Released`**: Sponsor approves deliverable, releasing locked funds directly to builder.
- **`Refunded`**: Sponsor reclaims locked funds if milestone is aborted prior to release.

---

## 📜 Deployed Smart Contracts (Stellar Testnet)

| Contract | Network | Address / Contract ID | Explorer Link |
| :--- | :--- | :--- | :--- |
| **VaultPay Escrow Contract** | Testnet | `CCK7CXFEAQIFWLBBOVMGBQD2BHYDJJRUN2Z7VZFZE5OEU6FS5BGX3MCX` | [StellarExpert Explorer](https://stellar.expert/explorer/testnet/contract/CCK7CXFEAQIFWLBBOVMGBQD2BHYDJJRUN2Z7VZFZE5OEU6FS5BGX3MCX) |
| **Bounty Box Contract** | Testnet | `CDYIRLVHTA34LR5SPDCS42CNSMB6V4R7A4NASFZCLQ52ICHJMKN4YHYU` | [StellarExpert Explorer](https://stellar.expert/explorer/testnet/contract/CDYIRLVHTA34LR5SPDCS42CNSMB6V4R7A4NASFZCLQ52ICHJMKN4YHYU) |
| **Bounty Registry** | Testnet | `CC4KVRNPU33PKYHDHO6T2YYID2D6O2RRKUBCWSH4CLYUZ6ZFEZLFIIYA` | [StellarExpert Explorer](https://stellar.expert/explorer/testnet/contract/CC4KVRNPU33PKYHDHO6T2YYID2D6O2RRKUBCWSH4CLYUZ6ZFEZLFIIYA) |
| **Native XLM Token SAC** | Testnet | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | [StellarExpert Explorer](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

---

## ⚙️ Smart Contract Interface Specification

Contract implementation is located in [`contracts/escrow_contract/src/lib.rs`](contracts/escrow_contract/src/lib.rs).

### 1. `initialize_vault`
- **Parameters**: `env: Env`, `sponsor: Address`, `builder: Address`, `token: Address`, `amount: i128`, `milestone_id: u32`
- **Authorization**: `sponsor.require_auth()`
- **Logic**: Validates `amount > 0`, checks milestone ID uniqueness, initializes vault state to `Created`.

### 2. `fund_vault`
- **Parameters**: `env: Env`, `milestone_id: u32`
- **Authorization**: `sponsor.require_auth()`
- **Logic**: Verifies vault is in `Created` state, transfers `amount` tokens from sponsor to contract address, updates status to `Funded`.

### 3. `submit_work`
- **Parameters**: `env: Env`, `milestone_id: u32`, `deliverable_url: String`
- **Authorization**: `builder.require_auth()`
- **Logic**: Verifies vault is `Funded`, records deliverable URL proof, transitions state to `Submitted`.

### 4. `approve_and_release`
- **Parameters**: `env: Env`, `milestone_id: u32`
- **Authorization**: `sponsor.require_auth()`
- **Logic**: Verifies vault is `Submitted`, transfers escrowed tokens directly from contract to `builder`, updates status to `Released`.

### 5. `refund`
- **Parameters**: `env: Env`, `milestone_id: u32`
- **Authorization**: `sponsor.require_auth()`
- **Logic**: Verifies status is `Funded` or `Submitted`, transfers tokens back to `sponsor`, updates status to `Refunded`.

### 6. `get_status` & `get_vault`
- **Parameters**: `env: Env`, `milestone_id: u32`
- **Returns**: `Symbol` (status) or `Vault` struct containing all milestone metadata.

---

## 🧪 Smart Contract Test Suite & Verification

The test suite in [`contracts/escrow_contract/src/test.rs`](contracts/escrow_contract/src/test.rs) covers 100% of state transitions and failure cases:

```bash
$ cargo test --manifest-path contracts/escrow_contract/Cargo.toml

running 9 tests
test test::test_zero_amount_fails - should panic ... ok
test test::test_non_existent_vault_panics - should panic ... ok
test test::test_duplicate_milestone_id_fails - should panic ... ok
test test::test_release_before_submit_fails - should panic ... ok
test test::test_double_fund_prevention - should panic ... ok
test test::test_refund_from_submitted ... ok
test test::test_refund_from_funded ... ok
test test::test_full_happy_path ... ok
test test::test_double_release_prevention - should panic ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s
```

All workspace test suites run cleanly:
```bash
cargo test --manifest-path contracts/bounty_box/Cargo.toml      # 3 tests ok
cargo test --manifest-path contracts/escrow_contract/Cargo.toml # 9 tests ok
```

---

## 💻 Frontend & Freighter Wallet Integration

- **Framework**: Vite 8 + React 19 + TypeScript + TailwindCSS
- **Design Aesthetic**: Warm beige background (`#FBF8F3`), crimson brand accents (`#8B0000`), Playfair Display serif typography, and glass-card components.
- **Wallet Support**: Freighter Browser Extension with automatic testnet balance fetching from Horizon.
- **RPC Integration**: Real `@stellar/stellar-sdk` Soroban RPC client simulation, XDR generation, Freighter pop-up signing, and transaction polling with live StellarExpert links.

### Step-by-Step Testing Guide:

1. **Prerequisites**: Install the [Freighter Wallet](https://www.freighter.app/) extension and set network to **Testnet**.
2. **Fund Wallet**: Fund your testnet address using [Stellar Friendbot](https://stellar.org/developers/tools/lumens).
3. **Connect**: Click **Connect Freighter** in the top navbar.
4. **Sponsor Flow**:
   - Switch to the **Sponsor Portal**.
   - Click **Create Vault**, fill in title, builder address, and amount, then approve the Freighter pop-ups.
   - The on-chain transaction hash appears with a direct link to StellarExpert.
5. **Builder Flow**:
   - Switch to the **Builder Portal**.
   - Select a funded milestone, click **Submit Deliverable**, paste your proof link, and sign the transaction in Freighter.
6. **Payout Release**:
   - As sponsor, review deliverable proof and click **Approve & Release Payout**.
   - Tokens transfer instantly to the builder on-chain.

---

## 🛠️ Local Development & Build

### Smart Contracts

```bash
# Run contract unit tests
cargo test --manifest-path contracts/escrow_contract/Cargo.toml

# Build release WASM bytecode
cargo build --manifest-path contracts/escrow_contract/Cargo.toml --target wasm32-unknown-unknown --release
```

### Frontend dApp

```bash
cd frontend

# Install dependencies
npm install

# Start local dev server
npm run dev

# Run production build
npm run build
```

---

## 📸 Interface Preview

| Multi-Wallet & Escrow | Milestone Dashboard | Mobile View |
| :---: | :---: | :---: |
| ![Wallet](walletconnect.png) | ![UI](ui_1.jpeg) | ![Mobile](newmobile.jpeg) |

---

*Built for the Stellar Soroban Dojo — Level 4 Green Belt Submission*
