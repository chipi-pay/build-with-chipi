# Mobile Copy Order (Expo + Clerk + Chipi)

Use this when you copy the tutorial into another project and need a clean "do this first, then this" flow.

## 0) Install deps + env first

1. Install the Expo/Clerk/Chipi packages from this tutorial's `package.json`.
2. Add env vars:
   - `EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

Without this step, the providers and hooks will fail immediately.

## 1) Foundation files (copy first)

1. `app/providers.tsx`
2. `app/_layout.tsx`
3. `utils/secureStorage.ts`
4. `constants/morgan-theme.ts` (UI theme)

Why first: every screen/component depends on auth + SDK providers and shared constants.

## 2) Navigation shell

1. `app/(home)/_layout.tsx`
2. `app/(home)/index.tsx` (main wallet validation screen)
3. `app/(home)/docs.tsx` (docs/reference screen)

## 3) Auth (mobile-only)

1. `components/auth/sign-in-form.tsx`
2. `components/auth/sign-up-form.tsx`
3. `app/(auth)/_layout.tsx`
4. `app/(auth)/sign-in.tsx`
5. `app/(auth)/sign-up.tsx`

## 4) Shared UI helpers

1. `components/ui/PrimaryButton.tsx`
2. `components/ui/SimpleInput.tsx`

## 5) Hook demo components (copy in this order for videos)

1. `components/chipi/create-wallet-with-biometric-pin.tsx` (`useCreateWallet`)
2. `components/chipi/create-wallet-with-passkey-native.tsx` (`useCreateWallet` with `usePasskey`)
3. `components/chipi/wallet-details-use-get-wallet.tsx` (`useGetWallet`)
4. `components/chipi/token-balance-use-get-token-balance.tsx` (`useGetTokenBalance`)
5. `components/chipi/send-usdc-biometric-pin.tsx` (`useTransfer`, PIN flow)
6. `components/chipi/send-usdc-passkey-params.tsx` (`useTransfer`, passkey flow)
7. `components/chipi/transaction-list-use-get-transaction-list.tsx` (`useGetTransactionList`)
8. `components/chipi/migrate-wallet-to-passkey.tsx` (`useMigrateWalletToPasskey`)
9. `components/chipi/native-biometric-diagnostics.tsx` (low-level diagnostics)
10. `components/chipi/wallet-overview-use-chipi-wallet.tsx` (composite helper hook)

Then wire these into `app/(home)/index.tsx` in the same sequence.

## 6) Optional docs/support screens

1. `app/(home)/docs.tsx` (docs links screen)
2. `app/modal.tsx` (about modal)

---

## Next.js mental model -> Expo equivalent

If you are more familiar with Next.js App Router, use this mapping:

- `app/layout.tsx` -> `app/_layout.tsx` (Expo Router root layout)
- Next providers in `layout.tsx` -> `app/providers.tsx`
- `@clerk/nextjs` -> `@clerk/clerk-expo`
- `@chipi-stack/nextjs` / `@chipi-stack/chipi-react` -> `@chipi-stack/chipi-expo`
- Browser local/session storage patterns -> `expo-secure-store` (`utils/secureStorage.ts`)
- Web passkeys assumptions -> native passkeys + device biometrics (dev build recommended)

## Known doc gotchas to explain in your video

Use `plan/bugs.md` as your "reality vs docs" source. Key points:

1. `createWalletAsync` returns wallet fields at top-level (not `result.wallet`).
2. Use `normalizedPublicKey ?? publicKey` (not `accountAddress`).
3. For passkey transfer params, pass `usePasskey: true` and `externalUserId`.
4. Paginated list field is `data` (not `items`).
5. Keep Clerk `tokenCache` enabled for mobile session persistence.

## Suggested recording order (short version)

1. Setup: env + providers
2. Auth on device
3. Create wallet (PIN)
4. Get wallet + get token balance
5. Transfer
6. Transaction list
7. Migrate to passkey
8. Wrap-up with diagnostics + docs mismatches from `bugs.md`
