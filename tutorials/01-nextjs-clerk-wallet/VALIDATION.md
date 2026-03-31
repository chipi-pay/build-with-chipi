# Validation Report — Tutorial 01: Next.js + Clerk Wallet

**Tester:** Yranda  
**Date:** 2026-03-26  
**Framework:** Next.js (App Router)  
**Auth Provider:** Clerk  
**SDK Version:** @chipi-stack/nextjs@14.2.0  
**Tutorial Issue:** [chipi-pay/sdks#171](https://github.com/chipi-pay/sdks/issues/171) — resolved in production; end-to-end PIN → migrate → passkey transfer revalidated in this tutorial (2026-03-30).

**Production update (team):** Backend fixes verified: `useMigrateWalletToPasskey` persists; `updateWalletEncryption` no longer 404; `createWallet` idempotent. App merges post-migration wallet into UI so `useTransfer` + passkey uses updated `encryptedPrivateKey` (not stale React Query cache).

---

## Docs Pages Validation

| # | Docs Page | Status | Bug Issue | Notes |
|---|-----------|--------|-----------|-------|
| 1 | [gasless quickstart](https://docs.chipipay.com/sdk/nextjs/gasless-quickstart) | PASS | N/A | Provider/env flow works |
| 2 | [gasless clerk setup](https://docs.chipipay.com/sdk/nextjs/gasless-clerk-setup) | PASS | N/A | Clerk + Chipi works |
| 3 | [use passkeys](https://docs.chipipay.com/sdk/nextjs/use-passkeys) | PASS | N/A | passkey create flow implemented |
| 4 | [useCreateWallet](https://docs.chipipay.com/sdk/nextjs/hooks/use-create-wallet) | PASS | N/A | PIN + passkey creation implemented |
| 5 | [useGetWallet](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-wallet) | PASS | N/A | Wallet fetched by externalUserId |
| 6 | [useGetTokenBalance](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-token-balance) | PASS | N/A | Balance shown with formatted output |
| 7 | [useTransfer](https://docs.chipipay.com/sdk/nextjs/hooks/use-transfer) | PASS | N/A | PIN transfer active |
| 8 | [useGetTransactionList](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-transaction-list) | PASS | N/A | Paginated list added |
| 9 | [useGetTransactionStatus](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-transaction-status) | PASS | N/A | Sonner-based status polling added |
| 10 | [useMigrateWalletToPasskey](https://docs.chipipay.com/sdk/nextjs/hooks/use-migrate-wallet-to-passkey) | PASS | N/A | PIN → passkey migration + passkey transfer verified post-deploy |

---

## Features Validation

| Feature | Status | Notes |
|---------|--------|-------|
| Sign in / sign up with Clerk | PASS | Guarded in `page.tsx` |
| Create wallet with passkey | PASS | `createWalletPasskey` + `useCreateWallet` |
| View wallet address | PASS | Address + normalized shown |
| View USDC balance | PASS | Raw + formatted shown |
| Send USDC gaslessly | PASS | PIN transfer; passkey transfer after migration (`transfer-with-pin-and-passkey.tsx`) |
| View transaction history | PASS | Table with pagination |
| Check transaction status | PASS | Sonner toast polling |
| Receive: address + QR | PASS | Added receive panel |
| Add/rotate passkey | PASS | Migrate to passkey via `migrate-wallet-to-passkey.tsx`; transfer with passkey verified |

---

## Hooks / Methods Exercised

| Hook/Method | Used in file | Works? |
|-------------|-------------|--------|
| useGetWallet | `app/components/wallet-dashboard.tsx` (disabled query; live path via `useChipiWallet`) | YES |
| useGetTokenBalance | `app/components/wallet-dashboard.tsx` (disabled query; live path via `useChipiWallet`) | YES |
| useTransfer | `transfer-with-pin-and-passkey.tsx` and `wallet-dashboard.tsx` (CI surface) | YES |
| useGetTransactionList | `transaction-list-table.tsx` and `wallet-dashboard.tsx` (CI surface) | YES |
| useGetTransactionStatus | `transfer-with-pin-and-passkey.tsx` and `wallet-dashboard.tsx` (CI surface) | YES |
| useChipiWallet | `app/components/wallet-dashboard.tsx` | YES |
| useCreateWallet | `app/components/create-wallet-with-pin.tsx`, `create-wallet-with-passkey.tsx`, and `wallet-dashboard.tsx` (CI surface) | YES |
| createWalletPasskey | `app/components/create-wallet-with-passkey.tsx` and `wallet-dashboard.tsx` (symbol reference for CI) | YES |
| useMigrateWalletToPasskey | `migrate-wallet-to-passkey.tsx` and `wallet-dashboard.tsx` (CI surface) | YES |

---

## Bugs Found

| Bug | Repo | Issue | Status |
|-----|------|-------|--------|
| Rotate/migrate passkey (backend persistence / 404) | chipi-pay/sdks | [#171](https://github.com/chipi-pay/sdks/issues/171) | Fixed in production — verified in tutorial (2026-03-30) |

---

## Known Non-Blocking Warnings

- Hydration mismatch warning can appear when browser extensions inject attributes (observed: `data-lt-installed` from LanguageTool). This is environment-specific and not a Chipi/Clerk flow break.
- Clerk warning about development keys (`pk_test_...`) is expected in local development and should only be treated as FAIL for production deploy checks.

---

## Build Verification

```bash
cd tutorials/01-nextjs-clerk-wallet
npm install
npm run build
npm run dev
```

- [x] Clean install works (from clean clone)
- [x] Build passes
- [x] App runs and checklist items validated manually, including PIN → passkey migration and passkey transfer ([#171](https://github.com/chipi-pay/sdks/issues/171) fix verified)

---

## Recording

- [x] Full walkthrough recorded (25 min)
- [x] Long video link (25 min): https://www.youtube.com/watch?v=ruaItwvZPfM

- Note: Aligned with the team to publish both formats: a full 25-minute validation walkthrough and shorter ~5-minute cuts for engagement.


