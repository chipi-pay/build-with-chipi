# Chipi Next.js Docs vs Implementation Gap Report

Project audited: `tutorials/01-nextjs-clerk-wallet/`  
Date: 2026-03-26  
Framework: Next.js App Router + Clerk

## Summary

This report compares the requested docs flow with what was required in real implementation.  
Main finding: core APIs work, but multiple examples still assume older return shapes or omit required production wiring (real bearer token, dynamic wallet source, and status polling UX).

## Per-page findings

| # | Docs page | Expected from docs | Actual needed in implementation | Severity |
|---|---|---|---|---|
| 1 | [gasless-quickstart](https://docs.chipipay.com/sdk/nextjs/gasless-quickstart) | `ChipiProvider` in `layout.tsx`, env keys, start with hooks | Works, but app also needs explicit Clerk gating and robust token handling in all hooks | Medium |
| 2 | [gasless-clerk-setup](https://docs.chipipay.com/sdk/nextjs/gasless-clerk-setup) | Clerk + Chipi provider setup | Works, but route protection in Next 16 must be done in `proxy.ts` (not mixed middleware/proxy) | High |
| 3 | [use-passkeys](https://docs.chipipay.com/sdk/nextjs/use-passkeys) | passkey create/auth/migrate snippets | Needed explicit real token + persisted wallet source; passkey transfer used as commented alternate path per test flow | Medium |
| 4 | [use-create-wallet](https://docs.chipipay.com/sdk/nextjs/hooks/use-create-wallet) | Create wallet, `data` includes wallet/tx metadata | In current SDK typing/runtime, wallet object is treated flat in many hook paths; example shape in docs can confuse implementation | High |
| 5 | [use-get-wallet](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-wallet) | Query by `externalUserId` with `getBearerToken` | Works as documented | Low |
| 6 | [use-get-token-balance](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-token-balance) | Query by wallet address or externalUserId | Works, but should be guarded with `enabled` until wallet exists to avoid noisy errors | Medium |
| 7 | [use-transfer](https://docs.chipipay.com/sdk/nextjs/hooks/use-transfer) | Transfer with wallet+token+amount | Doc examples use hardcoded wallet placeholders; real flow requires fetched wallet object and real Clerk token | High |
| 8 | [use-get-transaction-list](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-transaction-list) | paginated list at `data.data` | Works; needs dynamic wallet address + pagination state in UI | Low |
| 9 | [use-get-transaction-status](https://docs.chipipay.com/sdk/nextjs/hooks/use-get-transaction-status) | polling and terminal status handling | Works; needed toast lifecycle management to avoid duplicate notifications | Medium |
| 10 | [use-migrate-wallet-to-passkey](https://docs.chipipay.com/sdk/nextjs/hooks/use-migrate-wallet-to-passkey) | migrate from PIN to passkey | Works; must persist returned wallet + credential id and refresh local wallet state | Low |

## Hook/method mapping to implemented code

- `useCreateWallet`: `app/components/use-create-normal-wallet.tsx`, `app/components/create-wallet-with-passkey.tsx`
- `createWalletPasskey`: `app/components/create-wallet-with-passkey.tsx`
- `useGetWallet`: `app/page.tsx`
- `useChipiWallet`: `app/page.tsx` (snapshot panel)
- `useGetTokenBalance`: `app/page.tsx`
- `useTransfer`: `app/components/normal-transfer.tsx`
- `useGetTransactionList`: `app/components/transaction-list-table.tsx`
- `useGetTransactionStatus`: `app/components/normal-transfer.tsx` (polling + sonner)
- `useMigrateWalletToPasskey`: `app/components/migrate-wallet-tp-passkey.tsx`

## Key implementation decisions (deviations)

1. **PIN transfer kept active; passkey transfer kept commented in code**  
   Implemented in `normal-transfer.tsx` as requested for tutorial/testing flow.

2. **Transaction status shown via sonner toasts**  
   Added polling hook integration with terminal-state handling (`ACCEPTED_ON_L1/L2`, `REJECTED`, `REVERTED`).

3. **Route protection fixed for Next 16**  
   `proxy.ts` used as the single route middleware entrypoint.

4. **Receive section with QR**  
   Added address + QR panel in page flow.

## Suggested bug issues to file (if you want to report upstream)

1. **Docs shape mismatch risk in wallet examples**  
   Some snippets imply nested wallet response fields where current integration often uses a flat wallet object path.

2. **Transfer docs should discourage placeholder wallet object**  
   Example with hardcoded wallet object can mislead developers into bypassing `useGetWallet`.

3. **Next 16 route middleware note**  
   Add explicit guidance that projects using `proxy.ts` should not keep parallel middleware entry files.

## Tester checklist outcome

- Sign in / sign up with Clerk: implemented
- Create wallet with PIN: implemented
- Create wallet with passkey: implemented
- View wallet address: implemented
- View USDC balance: implemented
- Send USDC gaslessly: implemented
- View transaction history: implemented
- Check transaction status: implemented (sonner)
- Receive address + QR: implemented
- Migrate wallet to passkey: implemented

