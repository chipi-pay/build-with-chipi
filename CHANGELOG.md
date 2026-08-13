# Changelog

All notable changes to the `@chipi-stack` SDK packages are documented here.

## v14.11.0 (2026-08-12)

### Packaging: CommonJS now works everywhere

`@chipi-stack/core` (0.6.0), `@chipi-stack/starknet-connector` (0.3.0) and `@chipi-stack/x402` shipped ESM-only behind an `exports` map with no `require` condition. Because an `exports` field overrides `main`, every CommonJS resolver failed on them:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in
  .../node_modules/@chipi-stack/core/package.json
```

`core` is a runtime dependency of `backend`, `chipi-react` and `nextjs`, so **all three of those failed to load under `require()` too**. All now ship dual ESM + CommonJS.

The trigger was CommonJS *resolution*, not CommonJS *syntax*. An `import` statement inside a `.ts` file still failed under `tsx`, because a package without `"type": "module"` resolves through the CommonJS loader. Bundlers (Next.js, Vite, webpack) pick the `import` condition and were never affected, which is why this only broke standalone server scripts, cron jobs, `tsx`, `ts-node` and Jest.

If you are pinned to an older release, adding `"type": "module"` to the package.json of the script that imports the SDK forces the ESM path and works around it.

No API, runtime or type changes.

### `@chipi-stack/backend`

- **`sdk.treasury.list()`** returns every treasury the secret key's organization owns, so a `treasuryId` can be discovered programmatically instead of pinned in config. Previously `ChipiTreasury` exposed only `forTreasury({ treasuryId })`, and the sole listing endpoint sat behind the dashboard's Clerk session, so a lost id meant a trip to the dashboard. The `sk_` resolves the org server-side, so there is no org id parameter. Options: `page`, `limit` (server clamps to 1..100, default 25), `includeArchived` (default false). Server-only.

  Treasuries are organization-scoped, not user-scoped, so there is no `by-externalUserId` equivalent to the wallets lookup.

  Requires chipi-back's new `GET /v1/treasuries`.

### Upgrade note if you are on 14.8.0 or earlier

**You can delete any manual CHIPI vs SHHH branching in your signing code.** As of **v14.9.0**, `executeTransaction` / `transfer` / `callAnyContract` resolve `walletType` from the on-chain class hash whenever the caller omits it, then route SHHH through the OutsideExecution path automatically.

On 14.8.0 and earlier, an omitted `walletType` defaulted to `READY`, and a SHHH wallet sent down that path reverted on-chain with `C1: invalid tx version`. Apps that worked around it by branching on `wallet.walletType` and calling `executeShhhSponsoredRaw` themselves no longer need to: pass the wallet through the normal path and the SDK routes it. Passing an explicit `walletType` still works and skips the extra RPC read.

## v14.9.0 (2026-06-16)

### `@chipi-stack/chipi-react`

- **Embeddable multisig governance UI** on the `@chipi-stack/chipi-react/multisig` subpath: `<ProposeAction>` (template-driven propose dialog with a live "what this does" preview), `<Approvals>` (pending/recent list with Approve/Execute and a `renderContext` slot), and `<ApprovalInbox>` (cross-treasury "what needs me", mobile-first). Themeable via CSS-var tokens, zero Tailwind/CSS-import requirement, tree-shakeable. Built on the existing `useProposeAction` / `useTreasuryProposals` hooks — transports/signers inject as before.
- **Risk tiers** — `ActionTemplate.risk?: "ROUTINE" | "SENSITIVE"` flows through `createProposal`; `TreasuryProposal.risk` is returned in lists and `<Approvals>` shows a "Sensitive" chip (the backend applies the treasury's per-tier quorum policy).
- **Agent-proposer affordance** — `<Approvals>` / `<ApprovalInbox>` accept `isAgentProposal` + `agentLabel`, rendering an escalated agent proposal as "{label} wants: {title}" with an Agent chip.
- **Fix (H3):** `buildExecuteCalldata` now wraps exactly `requiredApprovals` signatures (lowest owner indices) instead of every collected one — prevents an extra/stale signature reverting the V2_THRESHOLD execute.

### `@chipi-stack/backend`

- **`ShhhAccount`** — an ergonomic drop-in adapter for signing as a SHHH V8.4 owner from a raw (exported) STARK private key. SHHH accounts have `__validate__` disabled, so the standard `new Account(...).execute()` path doesn't work; `ShhhAccount` hides the `execute_from_outside_v2` plumbing so a key holder can write `const { transactionHash } = await account.execute(calls)`. Pairs with the wallet's "export private key" self-custody flow.
- **Owner-pubkey formatters** — `eip191OwnerPubkeyParam`, `ed25519OwnerPubkeyParam`, `webauthnOwnerPubkeyParam` produce the kind-specific `ownerPubkey` string the treasury coordination endpoints expect (`sdk.treasury.forTreasury({ ownerPubkey })`). The coordinate kinds (WebAuthn/EIP-191) take the full `"x,y"` BE coordinates; Ed25519 takes `"low,high"` LE u128 halves — not the 4-felt `*PubkeyFelts` form.

- **Fix (C1) — gasless SHHH transfer reliability:** `executeTransaction` / `transfer` / `callAnyContract` now resolve `walletType` from the on-chain class hash when the caller omits it. A SHHH wallet passed without `walletType` previously defaulted to `READY` and was estimated as a direct sender, which panicked `C1: invalid tx version` and failed the transfer; it now resolves to SHHH and routes through the OutsideExecution path. CHIPI/READY behavior is unchanged. One extra RPC read, only when `walletType` is omitted.

- Additive; no existing exports changed. The rest of the fixed version group (`types`, `shared`, `nextjs`, `chipi-expo`, `x402`) bumps to 14.9.0 version-only. `core` (0.3.1) and `chipi-passkey` (2.2.0) are unchanged.

<!-- Intentionally NOT documented in 14.9.0: the get-starknet dApp connector
     (createChipiWindowObject / ChipiInjector / useChipiWalletObject, sdks#352)
     publishes in this version but is a Phase-0 primitive with no end-to-end
     walletv2 integration yet. Held back from the public changelog until the
     consumer-facing "Connect with Chipi" surface ships, to avoid pointing
     integrators at a half-built path. Flip this when walletv2 integrates it. -->

_Sources_: [`sdks#328`](https://github.com/chipi-pay/sdks/pull/328), [`sdks#329`](https://github.com/chipi-pay/sdks/pull/329), [`sdks#330`](https://github.com/chipi-pay/sdks/pull/330), [`sdks#331`](https://github.com/chipi-pay/sdks/pull/331), [`sdks#332`](https://github.com/chipi-pay/sdks/pull/332), [`sdks#350`](https://github.com/chipi-pay/sdks/pull/350), [`sdks#351`](https://github.com/chipi-pay/sdks/pull/351), [`sdks#356`](https://github.com/chipi-pay/sdks/pull/356).

## v14.8.0 (2026-06-05)

### `@chipi-stack/chipi-react`

- New tree-shakeable subpath **`@chipi-stack/chipi-react/multisig`** — SHHH multisig governance: propose any contract action (or a vote), collect N-of-M approvals, execute.
  - `defineActions` + the `ActionTemplate` engine and felt encoders (`toFelt`, `u256`, `amountToBase`); built-in `voteTemplate`.
  - Signer-/transport-agnostic OutsideExecution core: `buildActionProposal`, `signActionApproval`, `assembleActionExecuteCalldata`.
  - `useProposeAction` + `useTreasuryProposals` hooks, parameterized by an injectable `MultisigTransport` + `MultisigSigner` (the host owns the UI). Experimental — the API may change.
- Additive; no existing exports changed. The rest of the fixed version group (`types`, `shared`, `backend`, `nextjs`, `chipi-expo`, `x402`) bumps to 14.8.0 version-only.

_Sources_: [`sdks#322`](https://github.com/chipi-pay/sdks/pull/322), [`sdks#323`](https://github.com/chipi-pay/sdks/pull/323), [`sdks#324`](https://github.com/chipi-pay/sdks/pull/324), [`sdks#325`](https://github.com/chipi-pay/sdks/pull/325) (release).

> **Note:** v14.5.0–v14.7.0 (the SHHH V8.4 wave) shipped but are not yet itemized here; see the per-package `CHANGELOG.md` in the [sdks repo](https://github.com/chipi-pay/sdks) for those.

## v14.4.0 (2026-05-11)

### `@chipi-stack/types`

- New `SkuProvider` union (`"TET" | "CHIPI"`).
- `GetSkuListQuery` extended with `chipiCategory`, `carrierName`, `locale`. `provider` is now typed as `SkuProvider` (narrowed from `string` — TS-strict callers passing arbitrary strings need to update).

### `@chipi-stack/backend`

- `Currency` is now re-exported as a **value** (previously only as a type). `import { Currency } from "@chipi-stack/backend"` now works at runtime — callers no longer need to add `@chipi-stack/types` as a direct dep just for the enum.

Verified end-to-end against live staging on 2026-05-11. Credit to **Salvador (Medialane)** for the audit that surfaced both gaps.

_Sources_: [`sdks#209`](https://github.com/chipi-pay/sdks/pull/209) (feature), [`sdks#224`](https://github.com/chipi-pay/sdks/pull/224) (changeset), [`sdks#225`](https://github.com/chipi-pay/sdks/pull/225) (version-packages); chipi-back [`#235`](https://github.com/chipi-pay/chipi-back/pull/235).

## v14.3.1 (2026-04-09)

### `@chipi-stack/chipi-expo`

- **Fix:** export `useSyncOnChainTransfers`. The hook shipped in 14.3.0 for `@chipi-stack/chipi-react` but was never re-exported from the Expo package — Expo apps couldn't populate the backend transaction cache for externally received USDC. Pure re-export, no native adapter changes.

### Docs (across all frontend packages)

- Removed `CHIPI_SECRET_KEY` and `CLERK_SECRET_KEY` from Expo `.env` examples. Removed `VITE_CHIPI_SECRET_KEY` from React/Firebase docs (Vite bundles `VITE_`-prefixed vars into the client).
- Fixed `result.wallet` → `result` in `createWalletAsync` examples (`CreateWalletResponse` is flat).
- Fixed `wallet.accountAddress` → `wallet.normalizedPublicKey` (no such field as `accountAddress`).
- Added missing `chain: Chain.STARKNET` to all `createWalletAsync` examples.
- Realigned passkey examples with mandatory PIN backup (matches the "not recommended" label on passkey-only mode).
- Expo SDK 55 upgrade step added — `create-expo-app@latest` scaffolds SDK 54.0.33 but `chipi-expo` peer-requires SDK 55+.
- Dashboard URL: `/configure/api-keys` → `/configure/credentials`.

_Sources_: `chore: version packages` commit [`3d3d481`](https://github.com/chipi-pay/sdks/commit/3d3d481); PRs [`sdks#192`](https://github.com/chipi-pay/sdks/pull/192), [`sdks#193`](https://github.com/chipi-pay/sdks/pull/193).

## v14.3.0 (2026-04-03)

### Features

- **Passkey dual-key**: `usePasskey: true` + mandatory PIN backup on `useCreateWallet` and `useTransfer`.
- **`onPinRequired`** callback on `useTransfer` — automatic PIN fallback when passkey fails.
- **`useMigrateWalletToPasskey`** — adds passkey backup to an existing PIN-only wallet, persists the encryption update to the backend.
- **`useSyncOnChainTransfers`** — Voyager read-through cache for externally received USDC.
- **`useX402Payment`** — x402 payment protocol support.
- **Expo dual-key**: Face ID / Touch ID primary + PIN backup, same API as web.
- **`@chipi-stack/chipi-passkey`** (independent, → `2.1.0`):
  - PRF fix (blocks silent PBKDF2 fallback that caused decryption failures after page reload).
  - `verifyWalletPasskeyDetailed()` for diagnosing key mismatches.
  - Credential recovery from backend.
- **Custom class hash** support in paymaster + transaction execution.
- **x402 sugar layer** — DX convenience wrappers + session-txHash support.

### Fixes

- PRF silent fallback bug.
- Credential matching against target ID (not stale localStorage).
- Expo: only return null on biometric denial; rethrow other errors.
- Sponsored-tx failure flag reset + null-signature-element guards.
- Wallet-type-based class hash in paymaster adapter.

_Sources_: `chore: version packages` commit [`60e0dcc`](https://github.com/chipi-pay/sdks/commit/60e0dcc).

## v14.2.1 (2026-03-31)

Patch release — dependency bumps across the fixed-version group.

_Sources_: `chore: version packages` commit [`f6e2c2b`](https://github.com/chipi-pay/sdks/commit/f6e2c2b).

## v14.2.0 (2026-03-25)

### Spending Policy Management

Wraps the [`ISessionSpendingPolicy`](https://github.com/chipi-pay/sessions-smart-contract) contract interface so developers can set per-token spending caps on session keys. Based on [SNIP-163](https://github.com/starknet-io/SNIPs/pull/163).

**CHIPI v33 wallet contract** enforces limits automatically during transaction execution. v33 has been validated end-to-end with on-chain smoke tests; v29 wallets must [upgrade](https://docs.chipipay.com/sdk/guides/wallet-upgrades) before using SpendingPolicy entrypoints.

### New methods

`@chipi-stack/backend`:
- `sdk.sessions.setSpendingPolicy()` — set per-call and rolling-window limits for a token.
- `sdk.sessions.getSpendingPolicy()` — query current spend and limits (read-only, no gas).
- `sdk.sessions.removeSpendingPolicy()` — remove spending caps for a token.

`@chipi-stack/chipi-react`, `@chipi-stack/nextjs`:
- `useChipiSession` now returns `setSpendingPolicy`, `getSpendingPolicy`, `removeSpendingPolicy` plus their `isSetting…` / `isRemoving…` loading flags.

`@chipi-stack/types`:
- `SpendingPolicyConfig`, `SpendingPolicyData`, `SetSpendingPolicyParams`, `GetSpendingPolicyParams`, `RemoveSpendingPolicyParams`.

`@chipi-stack/x402`:
- Re-exports all spending policy types for agent payment developers.

### Validation

- Token address must not be empty.
- `windowSeconds` must be a positive integer within u64 range.
- `maxPerCall` and `maxPerWindow` must fit in u256.
- `maxPerCall` cannot exceed `maxPerWindow`.
- Wallet must be CHIPI type (backward compatible: omitted `walletType` defaults to CHIPI).

_Sources_: `chore: version packages` commit [`a69f704`](https://github.com/chipi-pay/sdks/commit/a69f704).

## v14.1.0 (2026-03-18)

### All framework packages

- Custom class hash support in paymaster and transaction execution
- New backend endpoints: transaction lookup, status polling, wallet upgrades
- On-chain USDC Transfer event verification
- CodeRabbit review fixes: env var for RPC, removed unused checks
- Zero-pad legacy class hashes to 64 hex digits

### @chipi-stack/x402

- x402 sugar layer — DX convenience wrappers for facilitator + client
- Session txHash vs standard wallet signature distinction
- Memoized bearer token + lastTxHash sync with lastPayment

### @chipi-stack/backend

- SKU management (getSkuList, getSku) with comprehensive test coverage
- Custom wallet types guide and on-chain verification guide

### @chipi-stack/chipi-expo

- Gasless transaction support

## v14.0.0 (2026-03-13)

### All packages

- **Breaking:** `chipi-nextjs` renamed to `@chipi-stack/nextjs`
- Unified versioning across framework packages (backend, react, nextjs, expo, x402, types, shared)

### @chipi-stack/x402 (new)

- x402 payment protocol for Starknet — first facilitator for AI agent payments
- Facilitator, middleware, and client utilities
- Dual payment flow: standard wallet (SNIP-12) + session payments
- Zero fees, gasless via paymaster, non-custodial

## Independent packages

### `@chipi-stack/chipi-passkey`

- **v2.1.0** (2026-04-03) — Shipped alongside framework `v14.3.0`. PRF silent-fallback fix, `verifyWalletPasskeyDetailed()`, credential recovery from backend, dual-key support across web + Expo. See [v14.3.0](#v1430-2026-04-03) for the full feature list — chipi-passkey is the underlying engine.
- **v2.0.0** (2026-03-13) — Major version bump for WebAuthn passkey utilities. Biometric login and seedless key management.

### `@chipi-stack/core`

- **v0.3.1** (2026-04-09) — CI alignment patch. starknet unified at `9.2.1` (was split between 7.6.4 and 9.2.1); `@simplewebauthn/browser` upgraded to v13.3.0; React peerDep `>=18.0.0`; Node engine `>=20.19.0`; Expo peerDep `>=55.0.0`; 31 vulnerabilities fixed via next devDep bump.
- **v0.3.0** (2026-03-13) — Core primitives: TxBuilder, Amount, SignerAdapter, TokenRegistry. Account abstraction foundation for all other packages.

## Python SDK (`chipi-stack` on PyPI)

The Python package is versioned independently and ships via PyPI.

- **v2.1.0** (2026-05-11) — **Bill payments support.** New `purchase_sku` / `apurchase_sku` + `get_sku_purchase` / `aget_sku_purchase` methods on `ChipiSDK`, wrapping `POST /sku-purchases`. New `CreateSkuPurchaseParams` model mirroring the Node SDK contract. New `Currency` enum (`MXN` / `USD`) added to `chipi_sdk.models.core` — was missing entirely. Fixes the previously broken `create_sku_transaction` which posted to a non-existent `/sku-transactions` endpoint with the wrong param shape. _Sources_: [`sdks#221`](https://github.com/chipi-pay/sdks/pull/221), [`sdks#223`](https://github.com/chipi-pay/sdks/pull/223).
- **v2.0.0** (2026-04-23) — **Renamed from `chipi-python` to `chipi-stack`**, matching the `@chipi-stack/*` npm scope. Pin imports remain `from chipi_sdk import ...`. Includes the flat `CreateWalletResponse` / `GetWalletResponse` shape alignment with the backend (no more nested `.wallet`). _Sources_: [`sdks#200`](https://github.com/chipi-pay/sdks/pull/200), [`sdks#201`](https://github.com/chipi-pay/sdks/pull/201).
