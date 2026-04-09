# Tutorial 02: Expo + Clerk — Mobile Wallet

A complete tutorial project demonstrating Chipi SDK integration with Expo (React Native) and Clerk authentication.

## Features

- ✅ Wallet creation with PIN encryption
- ✅ Biometric authentication (Face ID / Touch ID)
- ✅ Passkey migration (PIN → biometric)
- ✅ Token transfers (USDC on Starknet mainnet)
- ✅ Balance checking
- ✅ Transaction history
- ✅ On-chain transaction syncing
- ✅ Gasless transactions with session keys

## Prerequisites

- Node.js 20.19.0 or later
- Expo CLI (`npm install -g expo-cli`)
- A physical iOS or Android device with biometric capabilities
- Chipi Pay account ([Get started](https://dashboard.chipipay.com))
- Clerk account ([Get started](https://dashboard.clerk.com))

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd chipi-expo-clerk-tutorial
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Get your keys:
- **Chipi Public Key**: https://dashboard.chipipay.com/credentials
- **Clerk Publishable Key**: https://dashboard.clerk.com/

### 3. Configure Clerk JWKS Endpoint

1. Go to your Clerk dashboard
2. Navigate to the **Developers** tab
3. Copy your **JWKS Endpoint**
4. Add it to your [Chipi Dashboard](https://dashboard.chipipay.com)

### 4. Build and Run

**iOS** (requires macOS and Xcode):

```bash
npx expo run:ios
```

**Android** (requires Android Studio):

```bash
npx expo run:android
```

⚠️ **Important**: Biometric authentication requires a development build. It does NOT work in Expo Go.

## Project Structure

```
app/
  _layout.tsx           # Root layout with providers
  index.tsx             # Home/auth screen
  (tabs)/
    wallet.tsx          # Main wallet screen
    transfer.tsx        # Token transfer screen
    history.tsx         # Transaction history
    settings.tsx        # Settings and migration
src/
  components/
    ui/                 # Reusable UI components
  utils/
    secureStorage.ts    # Secure storage utilities
  constants/
    tokens.ts           # Token addresses
```

## Required Hooks Implementation

All required hooks from the documentation are implemented:

- ✅ `useCreateWallet` - Create a new wallet
- ✅ `useGetWallet` - Fetch wallet data
- ✅ `useChipiWallet` - Unified wallet management
- ✅ `useGetTokenBalance` - Check token balance
- ✅ `useTransfer` - Send tokens
- ✅ `useGetTransactionList` - Fetch transaction history
- ✅ `useSyncOnChainTransfers` - Sync on-chain transactions
- ✅ `useMigrateWalletToPasskey` - Migrate PIN wallet to passkey
- ✅ `createNativeWalletPasskey` - Create passkey-secured wallet
- ✅ `isNativeBiometricSupported` - Check biometric support

## Usage Guide

### 1. Create Wallet

1. Sign in with Clerk
2. Navigate to the **Wallet** tab
3. Enter a PIN (minimum 4 digits)
4. Tap **Create Wallet**
5. Optionally enable biometric authentication

### 2. Enable Biometrics

After creating a wallet:
1. Go to **Settings** tab
2. Tap **Migrate to Biometrics**
3. Enter your current PIN
4. Complete Face ID / Touch ID prompt

### 3. Transfer Tokens

1. Go to **Transfer** tab
2. Enter recipient address (Starknet format: 0x...)
3. Enter amount in USDC
4. Authenticate with PIN or biometric
5. Confirm transaction

### 4. View History

1. Go to **History** tab
2. View all transactions
3. Pull to refresh for on-chain sync

## Security Notes

- **Never commit `.env`** to version control
- PINs are collected client-side only
- Private keys are always encrypted
- Biometric data never leaves your device
- Secret keys belong on your backend only

## Testing on Simulator

**iOS Simulator**: Face ID is not available by default. Configure the simulator to use device passcode fallback or test on a real device.

**Android Emulator**: Enable fingerprint in AVD settings.

## Troubleshooting

### Clerk Peer Dependency Conflicts

If you encounter peer dependency conflicts with React 19:

```bash
npm install --legacy-peer-deps
```

### Biometrics Not Working

- Ensure you're using a development build (not Expo Go)
- Check that biometrics are enrolled on your device
- Verify permissions in `app.json`

### Wallet Creation Fails

- Verify your Chipi Public Key is correct
- Check that JWKS endpoint is configured in Chipi Dashboard
- Ensure you're signed in with Clerk

## Resources

- [Chipi SDK Documentation](https://docs.chipipay.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Telegram Community](https://t.me/chipipay)

## License

MIT