# Chipi Expo + Clerk — Mobile Wallet Tutorial

A complete mobile wallet application built with Expo, Clerk authentication, and the Chipi SDK. This tutorial demonstrates gasless transactions, biometric authentication, and passkey migration on Starknet.

## Features

- ✅ Wallet creation with PIN or passkey (Face ID/Touch ID)
- ✅ USDC balance checking (Starknet mainnet)
- ✅ Gasless token transfers
- ✅ Transaction history
- ✅ Biometric authentication for transactions
- ✅ Migrate existing PIN wallets to passkey
- ✅ Clerk authentication integration

## Prerequisites

- Node.js 20.19.0 or later
- Expo CLI
- iOS device with Face ID/Touch ID or Android device with fingerprint (biometrics don't work in simulators)
- Chipi Pay account → [Get API keys](https://dashboard.chipipay.com/api-keys)
- Clerk account → [Get API keys](https://dashboard.clerk.com)

## Installation

1. **Clone and install dependencies:**

```bash
git clone <your-repo-url>
cd chipi-expo-clerk-mobile-wallet
npm install
```

Note: If you encounter peer dependency conflicts with React 19, use:
```bash
npm install --legacy-peer-deps
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual keys from Chipi and Clerk dashboards.

3. **Configure Clerk JWKS endpoint:**

- Go to your [Clerk dashboard](https://dashboard.clerk.com)
- Navigate to **Developers** tab
- Copy your **JWKS Endpoint**
- Go to [Chipi dashboard](https://dashboard.chipipay.com)
- Paste the JWKS endpoint in the **API Keys** section

## Running the App

**Important:** Biometric features require a physical device. Expo Go does not support biometrics.

### Build development client:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Start the dev server:

```bash
npm start
```

## Project Structure

```
app/
├── _layout.tsx           # Root layout with providers
├── index.tsx            # Home screen
├── create-wallet.tsx    # Wallet creation with PIN or passkey
├── wallet.tsx           # View wallet balance and details
├── transfer.tsx         # Send USDC with biometric auth
├── transactions.tsx     # Transaction history
└── migrate-passkey.tsx  # Migrate PIN wallet to passkey
```

## SDK Hooks Used

This tutorial demonstrates all required hooks:

- ✅ `useCreateWallet` - Create new wallet
- ✅ `useGetWallet` - Fetch wallet data
- ✅ `useChipiWallet` - Unified wallet management (shown in docs examples)
- ✅ `useGetTokenBalance` - Check USDC balance
- ✅ `useTransfer` - Send tokens
- ✅ `useGetTransactionList` - View transaction history
- ✅ `useMigrateWalletToPasskey` - Upgrade to biometric auth
- ✅ `createNativeWalletPasskey` - Create passkey (used internally)
- ✅ `isNativeBiometricSupported` - Check biometric availability

## Key Features Explained

### Gasless Transactions

All transactions are gasless on Starknet mainnet using the Avnus integration. No gas fees required!

### Biometric Authentication

Two approaches are supported:

1. **Biometric-protected PIN:** Store PIN in secure storage with `requireAuthentication: true`
2. **Native passkey:** Use Face ID/Touch ID directly via `usePasskey: true`

### USDC Contract

This app uses Starknet mainnet USDC:
```
0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
```

## Testing

1. Create a wallet with either PIN or passkey
2. Check your balance on the Wallet screen
3. Send USDC to another address (use biometric authentication)
4. View transaction history
5. Migrate a PIN wallet to passkey if desired

## Important Notes

- ⚠️ Biometrics require a physical device (iOS/Android)
- ⚠️ Passkey migration is irreversible — the old PIN stops working
- ⚠️ Always verify recipient addresses before transferring
- ✅ All transactions are on Starknet mainnet
- ✅ Gas fees are sponsored by Chipi via gasless integration

## Troubleshooting

**Biometrics not working:**
- Make sure you're running on a physical device
- Check that Face ID/Touch ID is enrolled in device settings
- Rebuild the app after adding the `expo-local-authentication` plugin

**Transaction fails:**
- Ensure wallet has USDC balance
- Verify recipient address format
- Check network connectivity

## Resources

- [Chipi Documentation](https://docs.chipipay.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Telegram Support](https://t.me/chipipay)

## License

MIT