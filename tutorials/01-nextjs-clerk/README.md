# Chipi SDK Tutorial: Next.js + Clerk Wallet App

A complete wallet application built with Next.js, Clerk authentication, and the Chipi SDK.

## Features

- 🔐 Clerk authentication integration
- 💼 Wallet creation with PIN or passkey (biometric)
- 💸 USDC token transfers on Starknet
- 📊 Real-time balance tracking
- 📜 Transaction history with status tracking
- 🔑 Passkey migration for existing wallets
- ⛽ Gasless transactions (sponsored by Avnus)

## Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account
- A [Chipi](https://dashboard.chipipay.com) account

## Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Get your keys:
- **Clerk keys**: https://dashboard.clerk.com/
- **Chipi keys**: https://dashboard.chipipay.com/

3. **Configure Clerk JWKS in Chipi Dashboard:**

- Go to Clerk Dashboard → API Keys
- Copy your JWKS URL
- Go to Chipi Dashboard → API Keys
- Paste the JWKS URL into the "JWKS Endpoint" field

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── WalletDashboard.tsx # Main dashboard
│   ├── CreateWallet.tsx    # Wallet creation
│   ├── WalletInfo.tsx      # Wallet details
│   ├── TransferForm.tsx    # Token transfer
│   ├── TransactionList.tsx # Transaction history
│   └── MigrateToPasskey.tsx # Passkey migration
└── .env.example            # Environment template
```

## Usage

### Create a Wallet

1. Sign in with Clerk
2. Choose PIN or Passkey authentication
3. Wallet deploys automatically (gasless)

### Transfer Tokens

1. Enter recipient address (Starknet format: 0x...)
2. Enter amount in USDC
3. Confirm with your PIN or biometric
4. Transaction submits via gasless API

### Migrate to Passkey

1. Navigate to "Migrate to Passkey" section
2. Enter your current PIN
3. Complete biometric authentication
4. Your wallet is now secured with passkey

## Key Hooks Used

- `useChipiWallet` - Unified wallet management
- `useCreateWallet` - Wallet deployment
- `useGetWallet` - Fetch wallet data
- `useTransfer` - Token transfers
- `useGetTokenBalance` - Balance queries
- `useGetTransactionList` - Transaction history
- `useGetTransactionStatus` - Status polling
- `useMigrateWalletToPasskey` - Passkey migration
- `createWalletPasskey` - Passkey setup

## Security Notes

- Never commit `.env.local` to version control
- PINs are client-side only and never logged
- Private keys are encrypted at rest
- Passkeys use WebAuthn for biometric security

## Learn More

- [Chipi SDK Documentation](https://docs.chipipay.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

- [Chipi Telegram Community](https://t.me/chipipay)
- [Chipi Discord](https://discord.gg/chipipay)