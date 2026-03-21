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

## What you can build

- **Mobile wallets** with Face ID / Touch ID — users never see a seed phrase
- **Gasless payment apps** — USDC transfers with zero gas fees via paymaster
- **AI agent payments** — autonomous pay-per-use APIs with x402 protocol
- **Crypto checkout buttons** — drop-in React components for e-commerce
- **Remittance platforms** — cross-border USDC transfers on Starknet L2
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

## Documentation

Full docs, guides, and API reference: **[docs.chipipay.com](https://docs.chipipay.com)**

## Issues & Feature Requests

Found a bug? Have an idea? [Open an issue](https://github.com/chipi-pay/build-with-chipi/issues/new/choose).

## Built something with Chipi?

We'd love to see it! [Share your project](https://github.com/chipi-pay/build-with-chipi/issues/new?template=showcase.yml).

## License

[MIT](LICENSE) — Chipi Pay
