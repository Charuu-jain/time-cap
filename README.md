# VaultPay 🔐

VaultPay is a production-grade, Level 4 Stellar Soroban multi-sig escrow decentralized application (dApp). It enables secure milestone payments between project sponsors and builders.

## 🚀 Live Links
- **Live Demo Video Link:** `[Add Video Link Here]`
- **Vercel Deployment URL:** `[Add Vercel URL Here]`

## ⛓️ Network & Contract
- **Network:** Stellar Testnet
- **Contract ID:** `CBMPYTIDNBJSFO77QBHZMBFJPBT3TRL4XBS5KLMIMZGBS33BX6YUVMDY`

## 🏗️ Architecture Overview

The system consists of two main components:
1. **Soroban Smart Contract (`/contracts/escrow_contract`)**: A Rust-based contract managing state transitions. Sponsors deposit native or custom tokens into the contract securely. Once the builder completes their milestone, the sponsor triggers the `release_funds` function, utilizing Stellar's secure multi-sig capabilities and cross-account auth.
2. **Next.js Frontend (`/frontend`)**: A modern React frontend integrated with the `@stellar/freighter-api` and `stellar-sdk`. It features an intuitive Sponsor/Builder dual-portal and a live Activity Ledger to stream on-chain transaction history.

## 🛠️ Local Development

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (target `wasm32-unknown-unknown`)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- Node.js & npm

### Running the Contracts
1. Navigate to the contract directory: `cd contracts/escrow_contract`
2. Run tests: `cargo test`
3. Build WASM: `stellar contract build`
4. To test with automated mock escrows: `./contracts/scripts/seed_test_escrows.sh`

### Running the Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start local development server: `npm run dev`
4. Open `http://localhost:3000` in your browser. Ensure the Freighter wallet extension is installed.

## 📈 Analytics & Monitoring
The application utilizes PostHog for crash analytics and user transaction funnel monitoring. An ErrorBoundary catches unforeseen wallet exception crashes to maintain a smooth user experience.
