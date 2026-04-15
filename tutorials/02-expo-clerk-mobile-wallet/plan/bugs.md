# Doc vs installed SDK (living log)

Use this file during agile releases to track differences between `plan/plan.md` / marketing docs and what `@chipi-stack/chipi-expo` + peers actually ship.

## Matrix under test

| Layer | Version / notes |
| --- | --- |
| Expo SDK | `^55.0.11` (`expo`, `expo-router`, `expo-secure-store`, `expo-local-authentication`, etc. aligned to ~55) |
| React / React DOM | `19.2.0` (Expo 55 `expo install --fix` expects 19.2.0; using 19.2.4 caused peer noise with some packages) |
| `@chipi-stack/chipi-expo` | `14.2.1` (native passkey adapter; peers expect Expo 55-era secure store / local auth) |
| `@clerk/clerk-expo` | `^2.19.31` |

### Tooling note

Running `npx expo install --fix` in this repo completed `npm install` successfully but the CLI then threw `Cannot find module './utils/autoAddConfigPlugins.js'` while applying config plugins. Dependencies were still written; re-run after upgrading `@expo/cli` if you rely on the plugin auto-step.

---

## Entries

### 1. Create-wallet response shape (no nested `wallet`)

- **Doc link / section:** Historical snippets storing `result.wallet` after `createWalletAsync`.
- **What the doc shows:** `SecureStore.setItemAsync('wallet', JSON.stringify(result.wallet))`.
- **What the installed SDK does:** `@chipi-stack/types` documents `CreateWalletResponse = GetWalletResponse` — wallet fields are **top-level** on `result` (see comment in `index.d.mts`).
- **Corrected implementation:** `JSON.stringify(result)` (and read back the same JSON for `useTransfer` `wallet` param). Files: `create-wallet-with-biometric-pin.tsx`, `create-wallet-with-passkey-native.tsx`.
- **Severity:** API drift / doc typo.

### 2. Passkey example state bug (`setWallet(await result)`)

- **Doc link / section:** Informal passkey samples mirroring web code.
- **What the doc shows:** Treating `createWalletAsync` return value like a Promise when passed to `setState`.
- **What the installed SDK does:** `createWalletAsync` already resolves to `CreateWalletResponse`; `await result` is invalid.
- **Corrected implementation:** `setCreated(result)` with `CreateWalletResponse | null`. File: `create-wallet-with-passkey-native.tsx`.
- **Severity:** Doc typo / copy-paste error.

### 3. `accountAddress` vs `publicKey` / `normalizedPublicKey`

- **Doc link / section:** Examples using `accountAddress` for Starknet contracts.
- **What the doc shows:** Display or link using `accountAddress`.
- **What the installed SDK does:** `GetWalletResponse` exposes `publicKey` and `normalizedPublicKey` (no `accountAddress` on the type).
- **Corrected implementation:** Use `normalizedPublicKey ?? publicKey` for display and Starkscan links.
- **Severity:** Doc drift.

### 4. Expo imports: `chipi-react` / `nextjs` vs `chipi-expo`

- **Doc link / section:** Web tutorial imports (`@chipi-stack/chipi-react`, `@chipi-stack/nextjs`, `@clerk/nextjs`).
- **What the doc shows:** Same imports on Expo pages.
- **What the installed SDK does:** Expo must use `@chipi-stack/chipi-expo` (and `@clerk/clerk-expo`) so native passkey + secure storage adapters apply.
- **Corrected implementation:** All hooks/providers from `chipi-expo` in this app.
- **Severity:** Doc context mismatch.

### 5. `ChipiProvider` config shape

- **Doc link / section:** Some snippets pass a bare `apiPublicKey` prop on a fictional root component.
- **What the doc shows:** `<ChipiProvider apiPublicKey="…" />` (varies).
- **What the installed SDK does:** `ChipiProvider` expects `config: ChipiSDKConfig` with `{ apiPublicKey: string, ... }`.
- **Corrected implementation:** `app/providers.tsx` — `config={{ apiPublicKey: process.env.EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY }}`.
- **Severity:** API drift.

### 6. Clerk session persistence on device

- **Doc link / section:** Clerk Expo quickstart.
- **What the doc shows:** `ClerkProvider` without `tokenCache`.
- **What the installed SDK does:** Sessions should persist via `expo-secure-store`; `@clerk/clerk-expo/token-cache` provides the standard `tokenCache`.
- **Corrected implementation:** `ClerkProvider` + `tokenCache` in `app/providers.tsx`.
- **Severity:** Doc omission (runtime sessions lost on cold start without it).

### 7. Multi-account SecureStore leakage

- **Doc link / section:** Samples using fixed keys `'wallet'` / `'wallet_pin'`.
- **What the doc shows:** Single global key names.
- **What a real device needs:** If two Clerk users sign in on the same device, global keys can leak or overwrite wallet material.
- **Corrected implementation:** `utils/secureStorage.ts` scopes keys with `userId` (`chipi_wallet_${userId}`, `chipi_wallet_pin_${userId}`).
- **Severity:** Security / doc gap.

### 8. `useTransfer` with passkeys

- **Doc link / section:** “usePasskey: true directly in transaction hooks”.
- **What the doc shows:** Sometimes omits `externalUserId` when `usePasskey` is true.
- **What the installed SDK does:** `PasskeyEnabledParams` requires `usePasskey: true` **and** `externalUserId: string`.
- **Corrected implementation:** `send-usdc-passkey-params.tsx` passes both, plus `wallet` from SecureStore JSON.
- **Severity:** Doc omission (types will fail or runtime errors).

### 9. Native biometrics vs Expo Go

- **Doc link / section:** Passkeys / Face ID on Expo.
- **What the doc shows:** “Just run in Expo Go”.
- **What the platform does:** Full secure-enclave / passkey flows typically need a **dev build** or production build; Expo Go capabilities vary by OS version.
- **Corrected implementation:** Validate on `expo run:ios` / `expo run:android` when testing biometrics; note limitations in your public doc.
- **Severity:** Environment / doc expectation mismatch.

### 10. `createNativeWalletPasskey` vs `useCreateWallet`

- **Doc link / section:** Utilities table listing native helpers.
- **What the doc shows:** Sometimes implies calling low-level helpers for normal wallet creation.
- **What the installed SDK does:** `createNativeWalletPasskey` is a **public** primitive for encryption-key provisioning; `useCreateWallet` with `usePasskey: true` is the integrated path (see `chipi-expo` typings).
- **Corrected implementation:** `native-biometric-diagnostics.tsx` documents the split; demo button calls the low-level API only for diagnostics.
- **Severity:** Doc clarity (not a bug).

### 11. Paginated transaction list shape

- **Doc link / section:** Samples that assume `items` on list responses.
- **What the installed SDK does:** `PaginatedResponse<T>` uses a `data: T[]` field (plus `total`, `page`, `limit`, `totalPages`).
- **Corrected implementation:** `transaction-list-use-get-transaction-list.tsx` reads `data.data`.
- **Severity:** Doc drift.
