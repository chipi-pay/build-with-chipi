# Chipi Wallet App - Next.js + Clerk Tutorial

This tutorial demonstrates how to integrate Chipi SDK with Next.js and Clerk authentication to build a complete wallet application with gasless transactions on Starknet.

## Features

- ✅ Wallet creation with PIN or passkey
- ✅ Gasless transactions (gas fees sponsored by Avnus)
- ✅ Token transfers (USDC)
- ✅ Transaction history
- ✅ Biometric authentication with WebAuthn passkeys
- ✅ Wallet migration from PIN to passkey
- ✅ Real-time transaction status tracking

## Prerequisites

- Node.js 18+ installed
- A Clerk account ([clerk.com](https://clerk.com))
- A Chipi Dashboard account ([dashboard.chipipay.com](https://dashboard.chipipay.com))

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd chipi-nextjs-clerk-wallet-app
npm install
```

**Note:** If you encounter peer dependency conflicts with React 19 and Clerk, run:

```bash
npm install --legacy-peer-deps
```

This is a known Clerk + React 19 compatibility issue.

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 3. Get Your Clerk Keys

1. Go to [clerk.com](https://clerk.com) and create a new application
2. In your Clerk dashboard, go to **API Keys**
3. Copy the **Publishable Key** and **Secret Key**
4. Add them to your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. Get Your Chipi Keys

1. Go to [dashboard.chipipay.com](https://dashboard.chipipay.com)
2. Follow the quickstart guide:
   - Create a project
   - Configure authentication (select Clerk)
   - Copy your API keys
3. Add them to your `.env.local`:

```env
NEXT_PUBLIC_CHIPI_API_KEY=pk_prod_...
CHIPI_SECRET_KEY=sk_prod_...
```

## Running the App

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with Clerk + Chipi providers
│   ├── page.tsx            # Home page
│   ├── wallet/
│   │   └── page.tsx        # Wallet dashboard
│   └── passkey/
│       └── page.tsx        # Passkey setup and migration
├── components/
│   ├── CreateWallet.tsx              # PIN-based wallet creation
│   ├── CreateWalletWithPasskey.tsx   # Passkey wallet creation
│   ├── Transfer.tsx                  # PIN-based token transfer
│   ├── TransferWithPasskey.tsx       # Passkey token transfer
│   ├── MigrateToPasskey.tsx          # Migrate PIN wallet to passkey
│   ├── TransactionList.tsx           # Transaction history
│   ├── TokenBalance.tsx              # Token balance display
│   ├── TransactionStatus.tsx         # Transaction status tracker
│   └── GetWalletExample.tsx          # useGetWallet example
├── .env.example            # Environment variables template
└── package.json            # Dependencies
```

## Hooks Used

This tutorial demonstrates all required Chipi SDK hooks:

- `useCreateWallet` - Create a new wallet
- `useGetWallet` - Fetch wallet by user ID
- `useChipiWallet` - Unified wallet management
- `useGetTokenBalance` - Get token balance
- `useTransfer` - Transfer tokens
- `useGetTransactionList` - Fetch transaction history
- `useGetTransactionStatus` - Poll transaction status
- `useMigrateWalletToPasskey` - Migrate PIN to passkey
- `createWalletPasskey` - Via `@chipi-stack/chipi-passkey` hooks

## Key Features

### 1. Gasless Transactions

All transactions are gasless - gas fees are sponsored by Avnus integration on Starknet Mainnet.

### 2. Passkey Support

Use biometric authentication (Face ID, Touch ID, Windows Hello) instead of PINs:

- Create wallet with passkey from the start
- Migrate existing PIN-based wallet to passkey
- Transfer tokens using passkey authentication

### 3. Token Contract

The app uses Starknet mainnet USDC:
```
0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
```

## Troubleshooting

### Peer Dependency Warnings

If you see peer dependency warnings during installation:

```bash
npm install --legacy-peer-deps
```

### Authentication Errors

Make sure your `.env.local` has all four keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CHIPI_API_KEY`
- `CHIPI_SECRET_KEY`

### Passkey Not Working

Passkeys require:
- HTTPS or localhost
- Modern browser with WebAuthn support
- Biometric hardware (fingerprint reader, camera, etc.)

## Documentation

- [Chipi SDK Docs](https://docs.chipipay.com)
- [Clerk Docs](https://clerk.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## Support

Join the [Chipi Telegram Community](https://t.me/chipipay) for help and support.

## License

MIT