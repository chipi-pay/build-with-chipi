# Chipi SDK Tutorial 01: Next.js + Clerk — Wallet App

Complete working example of Chipi Pay integration with Next.js App Router and Clerk authentication.

## Features

- ✅ Wallet creation with PIN or Passkey
- ✅ Token balance display (USDC on Starknet)
- ✅ Token transfers with gasless transactions
- ✅ Transaction history and status tracking
- ✅ Passkey migration for existing wallets
- ✅ Full Clerk authentication integration

## Prerequisites

- Node.js 18+
- A Clerk account ([dashboard.clerk.com](https://dashboard.clerk.com))
- A Chipi API key ([docs.chipipay.com](https://docs.chipipay.com))

## Setup

1. **Clone and install:**

```bash
git clone <repository-url>
cd chipi-nextjs-clerk-wallet-app
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env.local` and add your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual keys:

- Get Clerk keys from: https://dashboard.clerk.com/
- Get Chipi keys from: https://docs.chipipay.com/

3. **Configure Clerk JWKS in Chipi Dashboard:**

- Copy your JWKS URL from Clerk dashboard (API Keys section)
- Add it to Chipi Dashboard → API Keys → JWKS Endpoint

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

- **Framework:** Next.js 14 (App Router)
- **Auth:** Clerk
- **Wallet SDK:** @chipi-stack/nextjs ^14.1.0
- **Passkey Support:** @chipi-stack/chipi-passkey ^14.1.0
- **Blockchain:** Starknet Mainnet
- **Token:** USDC (0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8)

## Hooks Used

All required hooks from the Chipi SDK documentation are implemented:

- `useCreateWallet` — Wallet creation
- `useGetWallet` — Fetch wallet data
- `useChipiWallet` — Unified wallet management
- `useGetTokenBalance` — Token balance queries
- `useTransfer` — Token transfers
- `useGetTransactionList` — Transaction history
- `useGetTransactionStatus` — Status polling
- `useMigrateWalletToPasskey` — Passkey migration
- `createWalletPasskey` — Create wallet with passkey from start

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main page with auth
│   └── globals.css         # Global styles
├── components/
│   ├── WalletDashboard.tsx # Main dashboard
│   ├── CreateWallet.tsx    # Wallet creation
│   ├── WalletInfo.tsx      # Wallet details
│   ├── TokenBalance.tsx    # Balance display
│   ├── TransferForm.tsx    # Transfer UI
│   ├── TransactionList.tsx # Transaction history
│   ├── TransactionStatus.tsx # Status tracker
│   └── PasskeyMigration.tsx # Passkey upgrade
├── .env.example            # Environment template
└── package.json            # Dependencies
```

## Security Notes

- PINs are never logged or transmitted in plain text
- Private keys remain encrypted at rest
- Biometric passkeys provide hardware-backed security
- All wallet operations require authentication

## Resources

- [Chipi SDK Documentation](https://docs.chipipay.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Chipi Telegram Community](https://t.me/chipipay)

## License

MIT