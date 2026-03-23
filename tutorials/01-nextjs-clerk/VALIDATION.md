# Tutorial 01: Next.js + Clerk — Wallet App — Validation Report

- **Framework:** Next.js (App Router)
- **Auth Provider:** Clerk
- **SDK Version:** <!-- run: npm list @chipi-stack/nextjs or pip show chipi-python -->
- **Date:** <!-- fill in -->
- **Tester:** @YrandaNova

## Docs Pages

| # | Page | PASS / FAIL | Notes |
|---|------|-------------|-------|
| 1 | [gasless quickstart](https://docs.chipipay.com/sdk/nextjs/gasless-quickstart) | PASS / FAIL | |
| 2 | [gasless clerk setup](https://docs.chipipay.com/sdk/nextjs/gasless-clerk-setup) | PASS / FAIL | |
| 3 | [use passkeys](https://docs.chipipay.com/sdk/nextjs/use-passkeys) | PASS / FAIL | |
| 4 | [use create wallet](https://docs.chipipay.com/sdk/nextjs/hooks/use-create-wallet) | PASS / FAIL | |
| 5 | [use get wallet](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-wallet) | PASS / FAIL | |
| 6 | [use get token balance](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-token-balance) | PASS / FAIL | |
| 7 | [use transfer](https://docs.chipipay.com/sdk/nextjs/hooks/use-transfer) | PASS / FAIL | |
| 8 | [use get transaction list](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-transaction-list) | PASS / FAIL | |
| 9 | [use get transaction status](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-transaction-status) | PASS / FAIL | |
| 10 | [use migrate wallet to passkey](https://docs.chipipay.com/sdk/nextjs/hooks/use-migrate-wallet-to-passkey) | PASS / FAIL | |

## Hooks / Methods

| Hook | In Code | Works | YES / NO |
|------|---------|-------|----------|
| useCreateWallet | YES / NO | YES / NO | |
| useGetWallet | YES / NO | YES / NO | |
| useChipiWallet | YES / NO | YES / NO | |
| useGetTokenBalance | YES / NO | YES / NO | |
| useTransfer | YES / NO | YES / NO | |
| useGetTransactionList | YES / NO | YES / NO | |
| useGetTransactionStatus | YES / NO | YES / NO | |
| useMigrateWalletToPasskey | YES / NO | YES / NO | |
| createWalletPasskey | YES / NO | YES / NO | |

## Features

| Feature | PASS / FAIL | Bug Filed | Notes |
|---------|-------------|-----------|-------|
| Sign in / sign up with Clerk | PASS / FAIL | | |
| Create wallet with passkey (WebAuthn prompt appears) | PASS / FAIL | | |
| View wallet address | PASS / FAIL | | |
| View USDC balance (even if 0) | PASS / FAIL | | |
| Send USDC to another address gaslessly | PASS / FAIL | | |
| View transaction history (list) | PASS / FAIL | | |
| Check transaction status | PASS / FAIL | | |
| Receive: display address + QR code | PASS / FAIL | | |
| Add/rotate passkey | PASS / FAIL | | |

## Bugs Found

<!-- Link each bug issue here: -->
<!-- - chipi-pay/sdks#XXX — description -->
<!-- - chipi-pay/chipi-back#XXX — description -->

## Recording

<!-- YouTube URL: -->
<!-- Duration: X:XX -->
