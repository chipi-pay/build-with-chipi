# Tutorial 02: Expo + Clerk — Mobile Wallet — Validation Report

- **Framework:** Expo (React Native)
- **Auth Provider:** Clerk
- **SDK Version:** @chipi-stack/chipi-expo@14.3.1 (see `package.json`; run `npm ls @chipi-stack/chipi-expo` to confirm lockfile)
- **Date:** 2026-04-09
- **Tester:** @YrandaNova

## Docs Pages

| # | Page | Status | Notes |
|---|------|-------------|-------|
| 1 | [gasless quickstart](https://docs.chipipay.com/sdk/expo/gasless-quickstart) | PASS | |
| 2 | [gasless clerk setup](https://docs.chipipay.com/sdk/expo/gasless-clerk-setup) | PASS | |
| 3 | [use biometrics](https://docs.chipipay.com/sdk/expo/use-biometrics) | PASS | |
| 4 | [use passkeys](https://docs.chipipay.com/sdk/expo/use-passkeys) | PASS | |
| 5 | [use create wallet](https://docs.chipipay.com/sdk/expo/hooks/use-create-wallet) | PASS | |
| 6 | [use get wallet](https://docs.chipipay.com/sdk/expo/hooks/use-get-wallet) | PASS | |
| 7 | [use get token balance](https://docs.chipipay.com/sdk/expo/hooks/use-get-token-balance) | PASS | Docs OK; **bugs:** (1) balance can disagree with `useChipiWallet` (cache / query keys). (2) After a transfer, **Refetch balance** in the token-balance section can return an **internal server error** (API/backend). |
| 8 | [use transfer](https://docs.chipipay.com/sdk/expo/hooks/use-transfer) | PASS | Transfer path OK in app; if **Refetch balance** then errors, see Bugs Found **#2** (balance API after send). |
| 9 | [use get transaction list](https://docs.chipipay.com/sdk/expo/hooks/use-get-transaction-list) | PASS | Docs OK; **bug:** in-app list shows **0** transactions while Starkscan/Voyager and Chipi show activity—see Bugs Found **#3**. |
| 10 | [use migrate wallet to passkey](https://docs.chipipay.com/sdk/expo/hooks/use-migrate-wallet-to-passkey) | PASS | Code present (`MigrateWalletToPasskeySection`); section commented out on default home—validated against docs when enabled. |

## Hooks / Methods

| Hook | In Code | Works | Confirmed |
|------|---------|-------|----------|
| useCreateWallet | YES | YES | YES |
| useGetWallet | YES | YES | YES |
| useChipiWallet | YES | YES | YES |
| useGetTokenBalance | YES | Partial | NO |
| useTransfer | YES | YES | YES |
| useGetTransactionList | YES | Partial | NO |
| useMigrateWalletToPasskey | YES | YES | YES |
| createNativeWalletPasskey | YES | YES | YES |
| isNativeBiometricSupported | YES | YES | YES |

**Notes on the table**

- **useGetTransactionList — Partial / NO:** Hook is wired and runs, but the validation UI shows an empty list (`0` on-page) while block explorers and Chipi return transactions—see Bugs Found **#3**.
- **useGetTokenBalance — Partial / NO:** Initial balance load can succeed, but **refetch after `useTransfer`** can surface an **internal server error** from the balance API; also see mismatch vs `useChipiWallet` (cache / query keys).
- **useSyncOnChainTransfers:** Not referenced in this tutorial app.

## Features

| Feature | Status | Bug Filed | Notes |
|---------|-------------|-----------|-------|
| Sign in / sign up with Clerk (mobile) | PASS | | |
| Create wallet with biometrics (fingerprint/face prompt appears) | PASS | | Section optional on home (commented); works when enabled. |
| Create wallet with passkey (alternative flow) | PASS | | |
| View wallet address | PASS | | |
| View USDC balance | PASS | | Mismatch vs overview (see #1); **refetch balance after send** can hit internal server error (see #2). |
| Send USDC gaslessly | PASS | | |
| View transaction history | FAIL | | In-app list shows 0 rows; explorers + Chipi show txs (see Bugs Found #3). |
| Add/rotate passkey | PASS | | Via migrate / passkey flows when those sections are enabled. |

## Bugs Found

1. **USDC balance mismatch (`useGetTokenBalance` vs `useChipiWallet`)**  
   - **Symptom:** Wallet overview (`useChipiWallet`) and the dedicated token-balance block (`useGetTokenBalance`) can show different USDC values.  
   - **Hypothesis:** Stale or divergent React Query cache between hooks, or refetch not propagating across query keys.  
   - **Track:** <!-- chipi-pay/sdks#XXX or chipi-pay/chipi-back#XXX — link when filed -->

2. **`useGetTokenBalance` refetch after transfer → internal server error**  
   - **Symptom:** After a successful gasless **transfer**, tapping **Refetch balance** in the token-balance section returns an **internal server error** (HTTP 5xx / API error), not a clean updated balance.  
   - **Hypothesis:** Backend race (indexer not ready), invalid state after tx, or balance endpoint bug when wallet/chain state changes post-transfer—needs API/logs triage.  
   - **Track:** <!-- chipi-pay/sdks#XXX or chipi-pay/chipi-back#XXX — link when filed -->

3. **`useGetTransactionList` shows zero rows in app**  
   - **Symptom:** UI reports `0` transaction(s) on the page; Starkscan/Voyager and Chipi API responses include transactions for the same wallet.  
   - **Hypothesis:** Wrong `walletAddress` / normalization vs what the indexer expects, query params (`page`/`limit`), API filter vs on-chain explorer scope, or response shape not matching what the UI maps.  
   - **Track:** <!-- chipi-pay/sdks#XXX or chipi-pay/chipi-back#XXX — link when filed -->

## Recording
- [x] Full walkthrough recorded (25 min)
- [x] Long video link (25 min): https://www.youtube.com/watch?v=VZj5UIa-CCA
