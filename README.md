# build-with-chipi

Developer hub for **@chipi-stack** — the SDK suite for building gasless Starknet applications.

> Zero gas fees. Zero seed phrases. Just ship.

## Packages

| Package | Version | What it does |
|---------|---------|-------------|
| [`@chipi-stack/core`](https://www.npmjs.com/package/@chipi-stack/core) | ![npm](https://img.shields.io/npm/v/@chipi-stack/core) | Wallet primitives — TxBuilder, SignerAdapter, TokenRegistry, account abstraction core |
| [`@chipi-stack/backend`](https://www.npmjs.com/package/@chipi-stack/backend) | ![npm](https://img.shields.io/npm/v/@chipi-stack/backend) | Server SDK — wallet provisioning, payments, SKU purchases, crypto remittances |
| [`@chipi-stack/chipi-react`](https://www.npmjs.com/package/@chipi-stack/chipi-react) | ![npm](https://img.shields.io/npm/v/@chipi-stack/chipi-react) | React hooks and components for wallet UIs and payment flows |
| [`@chipi-stack/nextjs`](https://www.npmjs.com/package/@chipi-stack/nextjs) | ![npm](https://img.shields.io/npm/v/@chipi-stack/nextjs) | Next.js integration with SSR and server actions support |
| [`@chipi-stack/chipi-expo`](https://www.npmjs.com/package/@chipi-stack/chipi-expo) | ![npm](https://img.shields.io/npm/v/@chipi-stack/chipi-expo) | React Native / Expo SDK with biometric passkey support |
| [`@chipi-stack/x402`](https://www.npmjs.com/package/@chipi-stack/x402) | ![npm](https://img.shields.io/npm/v/@chipi-stack/x402) | x402 protocol — AI agent payments, micropayments, pay-per-use middleware |
| [`@chipi-stack/chipi-passkey`](https://www.npmjs.com/package/@chipi-stack/chipi-passkey) | ![npm](https://img.shields.io/npm/v/@chipi-stack/chipi-passkey) | WebAuthn passkey auth — biometric login, seedless key management |
| [`@chipi-stack/types`](https://www.npmjs.com/package/@chipi-stack/types) | ![npm](https://img.shields.io/npm/v/@chipi-stack/types) | Shared TypeScript type definitions |
| [`@chipi-stack/shared`](https://www.npmjs.com/package/@chipi-stack/shared) | ![npm](https://img.shields.io/npm/v/@chipi-stack/shared) | Shared utilities, constants, and helpers |
| [`@chipi-stack/starknet-connector`](https://www.npmjs.com/package/@chipi-stack/starknet-connector) | ![npm](https://img.shields.io/npm/v/@chipi-stack/starknet-connector) | "Connect with Chipi" — a starknet-react connector so any Starknet dApp connects to a Chipi wallet (passkey, gasless, no extension) |

The tutorials target **14.18.0** for the `@chipi-stack/*` SDK packages (tutorial 06; 14.19.0 adds Solana as an optional entry point, see the [CHANGELOG](./CHANGELOG.md)), **14.17.0** for tutorials 03–05, and **0.5.0** for `@chipi-stack/starknet-connector`. The badges show what npm serves today.

## What you can build

- **Mobile wallets** with Face ID / Touch ID — users never see a seed phrase
- **Gasless payment apps** — USDC transfers with zero gas fees via paymaster
- **AI agent payments** — autonomous pay-per-use APIs with x402 protocol
- **Crypto checkout buttons** — drop-in React components for e-commerce
- **Remittance platforms** — cross-border USDC transfers on Starknet L2
- **Fund from any chain** — bring USDC from Base (or Arbitrum, Optimism, Polygon, Ethereum, and Solana from 14.19.0) into a Chipi wallet with Circle's CCTP, and withdraw back out
- **SKU marketplaces** — airtime top-ups, bill pay, gift cards
- **Gaming reward systems** — on-chain rewards without users knowing it's crypto
- **SaaS with wallet-per-user** — server-side wallet provisioning via backend SDK
- **DeFi dashboards** — multi-call transactions with account abstraction

## Quick start

```bash
npm install @chipi-stack/core @chipi-stack/backend
```

```typescript
import { ChipiSDK } from "@chipi-stack/backend";

const chipi = new ChipiSDK({
  apiPublicKey: "pk_prod_...",
  apiSecretKey: "sk_prod_...",
});

// Create a gasless wallet
const wallet = await chipi.createWallet({ ownerId: "user_123" });

// Send USDC (zero gas fees)
const tx = await chipi.transferToken({
  senderAddress: wallet.publicKey,
  recipientAddress: "0x...",
  amount: "10",
  tokenAddress: "USDC",
});
```

## Tutorials

Runnable, end-to-end examples in [`tutorials/`](./tutorials):

| # | Tutorial | What it shows |
|---|----------|---------------|
| 01 | [Next.js + Clerk wallet](./tutorials/01-nextjs-clerk-wallet) | A gasless web wallet with passkey auth via Clerk |
| 02 | [Expo + Clerk mobile wallet](./tutorials/02-expo-clerk-mobile-wallet) | The same wallet as a React Native / Expo mobile app |
| 03 | [Connect with Chipi](./tutorials/03-connect-with-chipi) | A Starknet **dApp** that connects to Chipi wallets with a one-line starknet-react connector (gasless signing), next to Bramble, Ready and Braavos in the same picker |
| 04 | [Agent with a session key and a passkey](./tutorials/04-agent-session-passkey) | A server-side AI agent that trades from a self-custodial passkey wallet inside on-chain caps: one prompt to hire it, one to stop it |
| 05 | [Bramble as a trusted wallet](./tutorials/05-bramble-trusted-wallet) | Sign in with Bramble, fund a Chipi passkey wallet from it, make Bramble a co-owner, and let it approve a capped agent session (14.17.0) |
| 06 | [Fund from Base](./tutorials/06-fund-from-base) | A passkey wallet funded with USDC from Base through Circle's CCTP: both speeds and prices shown first, one hook, close the page while it arrives, follow it from any device (14.18.0) |

## Documentation

Full docs, guides, and API reference: **[docs.chipipay.com](https://docs.chipipay.com)**

## Issues & Feature Requests

Found a bug? Have an idea? [Open an issue](https://github.com/chipi-pay/build-with-chipi/issues/new/choose).

## Built something with Chipi?

We'd love to see it! [Share your project](https://github.com/chipi-pay/build-with-chipi/issues/new?template=showcase.yml).

## License

[MIT](LICENSE) — Chipi Pay
