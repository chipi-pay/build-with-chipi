# Changelog

All notable changes to the `@chipi-stack` SDK packages are documented here.

## v14.1.0 (2026-03-18)

### All framework packages

- Custom class hash support in paymaster and transaction execution
- New backend endpoints: transaction lookup, status polling, wallet upgrades
- On-chain USDC Transfer event verification
- CodeRabbit review fixes: env var for RPC, removed unused checks
- Zero-pad legacy class hashes to 64 hex digits

### @chipi-stack/x402

- x402 sugar layer — DX convenience wrappers for facilitator + client
- Session txHash vs standard wallet signature distinction
- Memoized bearer token + lastTxHash sync with lastPayment

### @chipi-stack/backend

- SKU management (getSkuList, getSku) with comprehensive test coverage
- Custom wallet types guide and on-chain verification guide

### @chipi-stack/chipi-expo

- Gasless transaction support

## v14.0.0 (2026-03-13)

### All packages

- **Breaking:** `chipi-nextjs` renamed to `@chipi-stack/nextjs`
- Unified versioning across framework packages (backend, react, nextjs, expo, x402, types, shared)

### @chipi-stack/x402 (new)

- x402 payment protocol for Starknet — first facilitator for AI agent payments
- Facilitator, middleware, and client utilities
- Dual payment flow: standard wallet (SNIP-12) + session payments
- Zero fees, gasless via paymaster, non-custodial

## v2.0.0 (2026-03-13)

### @chipi-stack/chipi-passkey

- Major version bump for WebAuthn passkey utilities
- Biometric login and seedless key management

## v0.3.0 (2026-03-13)

### @chipi-stack/core

- Core primitives: TxBuilder, Amount, SignerAdapter, TokenRegistry
- Account abstraction foundation for all other packages
