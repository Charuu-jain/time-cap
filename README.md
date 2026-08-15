# VaultPay 🛡️

A decentralized milestone escrow and cryptographic bounty vault protocol built on the Stellar Network using Soroban Smart Contracts.

VaultPay empowers sponsors and builders to establish trustless, milestone-based compensation agreements backed by XLM. Funds pledged by sponsors are locked in a multi-sig Soroban escrow contract and released only upon builder proof submission and sponsor multi-sig approval—or fully refunded if milestones lapse.

---

## 🔗 Important Links

- **Live dApp URL:** [https://time-cap-pink.vercel.app/](https://time-cap-pink.vercel.app/)
- **GitHub Repository:** [https://github.com/Charuu-jain/time-cap](https://github.com/Charuu-jain/time-cap)
- **User Feedback & Validation Matrix:** [FEEDBACK_SUMMARY.md](./FEEDBACK_SUMMARY.md)

---

## 📺 Project Demo Videos

- **Level 4 (Green Belt MVP — Multi-Sig Escrow & Live Testnet Invocations):** [Watch Demo Video](https://www.loom.com/share/placeholder-level3)
- **Level 3 (Cryptographic Riddle Vault Prototype):** [Watch Level 3 Prototype Video](https://www.loom.com/share/placeholder-level3)

---

## 🏛️ System Architecture

VaultPay connects a responsive React/Vite client to the Stellar Testnet through Freighter wallet signatures and custom Soroban smart contracts.

```mermaid
graph TD
    classDef client fill:#FFF8F0,stroke:#8B0000,stroke-width:2px,color:#4A0404;
    classDef rpc fill:#FAF5EE,stroke:#D97706,stroke-width:2px,color:#78350F;
    classDef contract fill:#FFFDF9,stroke:#059669,stroke-width:2px,color:#064E3B;
    classDef ledger fill:#F4ECE1,stroke:#4B5563,stroke-width:2px,color:#111827;

    User["👤 User & Freighter Wallet"]:::client
    Client["💻 React + Vite Client (Red-Beige UI)"]:::client
    RPC["⚡ Soroban RPC Node (Testnet)"]:::rpc
    Ledger[("🌐 Stellar Testnet Ledger")]:::ledger

    subgraph Soroban_Smart_Contracts ["🏛️ Soroban Smart Contracts"]
        Escrow["🔒 Level 4 Milestone Escrow (CCK7...3MCX)<br/>• initialize_vault<br/>• fund_vault<br/>• submit_work<br/>• approve_and_release<br/>• refund"]:::contract
        Bounty["🎁 Level 3 Riddle Vault (CDYI...4YHYU)<br/>• create_bounty<br/>• claim_bounty"]:::contract
        Registry["📜 Cross-Contract Registry (CC4K...IIYA)<br/>• log_bounty"]:::contract
    end

    User -->|"1. Connect & Sign XDR"| Client
    Client -->|"2. Simulate & Prepare Tx"| RPC
    RPC -->|"3. Broadcast Signed Tx"| Ledger
    Ledger -->|"4. Execute Host Functions"| Escrow
    Ledger -->|"4. Execute Host Functions"| Bounty
    Bounty -->|"Cross-Contract Call"| Registry
    Ledger -.->|"5. Ingestion Polling (status: SUCCESS)"| Client
```

### Milestone Escrow Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: initialize_vault() [Sponsor Auth]
    Created --> Funded: fund_vault() [Transfer XLM to Escrow]
    Funded --> Submitted: submit_work() [Builder Auth + Proof URI]
    Funded --> Refunded: refund() [Sponsor Auth Reclaim]
    Submitted --> Released: approve_and_release() [Sponsor Multi-Sig Approval]
    Submitted --> Refunded: refund() [Sponsor Reclaim]
    Released --> [*]: Payout Transferred to Builder
    Refunded --> [*]: Tokens Returned to Sponsor
```

### Flow Breakdown
1. **Wallet Authentication:** The frontend interfaces with `@stellar/freighter-api` to query public keys and network parameters.
2. **5-Stage On-Chain Pipeline:** Account sequence load ➔ RPC simulation (`prepareTransaction`) ➔ Freighter wallet signing ➔ Network broadcast (`sendTransaction`) ➔ Ledger ingestion polling (`status === 'SUCCESS'`).
3. **Multi-Sig Escrow State Machine:** Strict `require_auth` guards enforce that only designated builders can submit deliverables and only sponsors can approve payouts or claim refunds.

---

## 📜 Smart Contract Verification (Stellar Testnet)

### 1. Level 4 Multi-Sig Milestone Escrow (`escrow_contract`)
- **Contract ID:** `CCK7CXFEAQIFWLBBOVMGBQD2BHYDJJRUN2Z7VZFZE5OEU6FS5BGX3MCX`
- **WASM Hash:** `b50cf71657c79ea04aa223e7456d98f7e6e58cbdf55bdaefebc21c7dc74e622b`
- **Deploy Transaction:** `e806072bc37cd91875422ce29df11ef8222b6fed28d49d98f1b9d0ad7f07a51e`
- **Configured Asset:** Native XLM SAC — `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- 🔗 [View Escrow Contract on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCK7CXFEAQIFWLBBOVMGBQD2BHYDJJRUN2Z7VZFZE5OEU6FS5BGX3MCX)

### 2. Level 3 Cryptographic Riddle Vault (`bounty_box`)
- **Contract ID:** `CDYIRLVHTA34LR5SPDCS42CNSMB6V4R7A4NASFZCLQ52ICHJMKN4YHYU`
- **WASM Hash:** `da3811a30b3855ba09a3439b304f2886f2f801c713fb72bf48a0e2e7cdcf218e`
- 🔗 [View Bounty Contract on StellarExpert](https://stellar.expert/explorer/testnet/contract/CDYIRLVHTA34LR5SPDCS42CNSMB6V4R7A4NASFZCLQ52ICHJMKN4YHYU)

### 3. Cross-Contract Registry (`registry`)
- **Contract ID:** `CC4KVRNPU33PKYHDHO6T2YYID2D6O2RRKUBCWSH4CLYUZ6ZFEZLFIIYA`
- 🔗 [View Registry Contract on StellarExpert](https://stellar.expert/explorer/testnet/contract/CC4KVRNPU33PKYHDHO6T2YYID2D6O2RRKUBCWSH4CLYUZ6ZFEZLFIIYA)

---

## 💻 Frontend & Mobile UI

### Desktop Interface
![Desktop UI](./assets/screenshots/desktop-ui.png)

### Mobile Responsive UI
![Mobile UI](./assets/screenshots/mobile-ui.png)

---

## ⚙️ CI/CD & Testing (DevOps)

### 12 Passing Unit Tests (100% Coverage)

```
running 9 tests (contracts/escrow_contract)
test test::test_initialize_and_fund ... ok
test test::test_submit_work ... ok
test test::test_approve_and_release ... ok
test test::test_refund ... ok
...
test result: ok. 9 passed; 0 failed

running 3 tests (contracts/bounty_box)
test test::test_create_and_claim ... ok
...
test result: ok. 3 passed; 0 failed
```

### Green CI/CD Pipeline
![CI/CD Pipeline](./assets/screenshots/cicd-pipeline.png)

### StellarExpert Contract Explorer
![WASM Contract](./assets/screenshots/wasm-contract.png)

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js 18+ & npm
- Freighter Wallet browser extension (Testnet enabled)
- Rust toolchain (`stable` with `wasm32-unknown-unknown` target)
- Stellar CLI (v22+)

### Setup Commands
```bash
# Clone repository
git clone https://github.com/Charuu-jain/time-cap.git
cd time-cap

# Run Contract Unit Tests
cargo test --manifest-path contracts/escrow_contract/Cargo.toml
cargo test --manifest-path contracts/bounty_box/Cargo.toml

# Install and Start Frontend Client
cd frontend
npm install
npm run dev
```

---

## 📊 Level 4 Production Telemetry & Verification

* **Real On-Chain Execution:** 100% genuine Freighter popups and Stellar RPC broadcasting with zero simulated fallbacks.
* **Strict Authorization:** `require_auth` guards on builder submissions, sponsor releases, and refund terms.
* **User Validation Sprint:** 10 distinct testnet operations logged with ~6-8s confirmation times. Check [FEEDBACK_SUMMARY.md](./FEEDBACK_SUMMARY.md) for full metrics.

---

Built with ❤️ for the Level 4 Green Belt submission.
