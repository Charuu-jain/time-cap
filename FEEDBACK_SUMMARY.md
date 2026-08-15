# VaultPay — Level 4 Testnet Feedback & User Validation Sprint

A comprehensive log of on-chain operations, performance metrics, and user feedback gathered across desktop and mobile during the Level 4 validation cycle on Stellar Testnet.

## 📊 On-Chain Interaction & Validation Matrix

| # | Action / Feature | On-Chain Function & Parameters | Transaction Hash / Explorer Link | Tester Role | Confirmation Time | Feedback & Verification Notes |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Escrow Deployment | Deploy WASM Bytecode & Instance | [`e806072...a51e`](https://stellar.expert/explorer/testnet/tx/e806072bc37cd91875422ce29df11ef8222b6fed28d49d98f1b9d0ad7f07a51e) | Deployer | ~5s | Contract instance initialized and verified on Testnet. |
| 2 | Initialize & Fund Vault | `initialize_vault` + `fund_vault` (100 XLM) | [`ce18a7a...4e97`](https://stellar.expert/explorer/testnet/tx/ce18a7a63ed03eb20d4466dc494753e3a9ef5d83048bcc2bf72b922bbbc44e97) | Sponsor | ~6s | Tokens locked in escrow storage; status updated to `Funded`. |
| 3 | Deliverable Submission | `submit_work` (Milestone 779903) | [`03bcaa2...94a1`](https://stellar.expert/explorer/testnet/contract/CCK7CXFEAQIFWLBBOVMGBQD2BHYDJJRUN2Z7VZFZE5OEU6FS5BGX3MCX) | Builder | ~7s | Deliverable URI registered on-chain with builder auth validation. |
| 4 | Approve & Release Payout | `approve_and_release` | Verified On-Chain | Sponsor | ~6s | Funds released directly to builder's wallet balance. |
| 5 | Refund Escrow | `refund` | Verified On-Chain | Sponsor | ~6s | Safety reclaim returns unlocked tokens to sponsor. |
| 6 | Create Riddle Bounty | `create_bounty` | [`CDYIRL...YHYU`](https://stellar.expert/explorer/testnet/contract/CDYIRLVHTA34LR5SPDCS42CNSMB6V4R7A4NASFZCLQ52ICHJMKN4YHYU) | Creator | ~7s | Cryptographic salt and prize locked into bounty vault. |
| 7 | Claim Riddle Bounty | `claim_bounty` | Verified On-Chain | Solver | ~6s | Validated via SHA-256 with instant token transfer. |
| 8 | Auth Rejection Test | `require_auth` enforcement | Verified Rejection | Security | ~4s | Non-authorized address calls correctly rejected by host. |
| 9 | Dual-Portal Sync | Sponsor / Builder toggle | UI State Flow | Tester | Instant | Live milestone status updates seamlessly across roles. |
| 10 | Mobile UX Test | Responsive viewport & wallet sign | UI / Freighter | Mobile Tester | ~8s | Clean layout and readable typography on mobile screens. |

## 💬 UX Feedback & Takeaways
- **Freighter Integration:** Clean popup triggers with clear fee estimates.
- **Red-Beige UI:** Polished aesthetic with high contrast and readable typography.
- **Error Feedback:** Actionable toast alerts for unauthorized attempts and wallet signature cancels.
