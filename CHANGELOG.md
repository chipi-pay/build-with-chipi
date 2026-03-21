# Changelog

All notable changes to the `@chipi-stack` SDK packages are documented here.

## v14.1.0 (2026-03-21)

### @chipi-stack/backend, @chipi-stack/chipi-react, @chipi-stack/nextjs, @chipi-stack/chipi-expo, @chipi-stack/x402, @chipi-stack/types, @chipi-stack/shared

- npm metadata hygiene: repository, homepage, bugs, author, keywords for all packages
- README improvements with "What you can ship" sections

## v14.0.0 (2026-03-13)

### All packages

- **Breaking:** `chipi-nextjs` renamed to `@chipi-stack/nextjs`
- Unified versioning across framework packages (backend, react, nextjs, expo, x402, types, shared)

### @chipi-stack/x402 (new)

- x402 payment protocol for Starknet — first facilitator for AI agent payments
- Facilitator, middleware, and client utilities
- Dual payment flow: standard wallet (SNIP-12) + session payments
- Zero fees, gasless via paymaster, non-custodial

### @chipi-stack/chipi-expo

- Gasless transaction support merged

### @chipi-stack/backend

- SKU management (getSkuList, getSku) with comprehensive test coverage

## v2.0.0 (2026-03-13)

### @chipi-stack/chipi-passkey

- Major version bump for WebAuthn passkey utilities
- Biometric login and seedless key management

## v0.3.0 (2026-03-21)

### @chipi-stack/core

- Core primitives: TxBuilder, Amount, SignerAdapter, TokenRegistry
- Account abstraction foundation for all other packages
