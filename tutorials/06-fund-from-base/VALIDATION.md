# Validation Report — Tutorial 06: Fund a Chipi wallet from Base

**Tester:** Claude (agent session). Not yet reviewed.
**Date:** 2026-10-25 (pre-release), 2026-10-26 (against the published 14.18.0)
**Framework:** Next.js 16.2.1 (App Router)
**Auth Provider:** Custom: anonymous account in a signed cookie + an RS256 JWT served at `/api/auth/jwks`
**SDK Version:** `@chipi-stack/nextjs` / `@chipi-stack/backend` `^14.18.0` (published 2026-10-26; `package-lock.json` resolves 14.18.0 from the registry. First checked against tarballs packed from source, see below)
**Tutorial Issue:** N/A

---

## Against the published 14.18.0 (2026-10-26)

`npm install` with the `^14.18.0` pins resolved every `@chipi-stack/*` package to 14.18.0 from npm; that `package-lock.json` is the one committed.

| Check | Result | Notes |
|-------|--------|-------|
| `npm install` | PASS | Registry packages, no overrides |
| `tsc --noEmit` | PASS | |
| `eslint .` | PASS | |
| `next build` | PASS | With a well-formed `NEXT_PUBLIC_CHIPI_API_KEY` |

## How it was first checked (pre-release)

On 2026-10-25, 14.18.0 was not on npm yet (`latest` was 14.17.2). The SDK was built and packed from `chipi-pay/sdks`, branch `feat/cross-chain-usdc`, commit `ee2b454` ([chipi-pay/sdks#434](https://github.com/chipi-pay/sdks/pull/434)). The packages still carry their 14.17.2 version numbers: the version bump comes with the release.

```bash
# chipi-pay/sdks
for p in types shared core chipi-passkey backend chipi-react nextjs; do pnpm --filter ./$p build; done
for p in types shared core chipi-passkey backend chipi-react nextjs; do (cd $p && pnpm pack --pack-destination <scratch>/packs); done

# this tutorial: TEMPORARY package.json edit
#   dependencies:  @chipi-stack/backend, @chipi-stack/nextjs -> file:<scratch>/packs/*.tgz
#   overrides:     every @chipi-stack/* package -> the same tarballs (so no 14.17.2 comes from npm)
npm install
npx tsc --noEmit
npx eslint .
NEXT_PUBLIC_CHIPI_API_KEY=pk_prod_<32 chars> npx next build

# then: package.json restored to the ^14.18.0 pins, the generated package-lock.json deleted
```

No lockfile is committed from that run: one generated against local tarballs would point at paths that exist only on the machine that made them. The lockfile comes from the registry after the release.

| Check | Result | Notes |
|-------|--------|-------|
| `tsc --noEmit` | PASS | Against the packed 14.18.0 source. Every SDK import resolves: `useCrossChainDeposit`, `useCctpDepositStatus`, `CrossChainDepositError`, `discoverEvmWallets`, `cctpEvmChainByKey`, `encodeEvmBalanceOf`, `formatCctpEta`, `CctpQuote`, `CctpStep`, `EvmWalletDetail` |
| `eslint .` | PASS | `eslint-config-next` 16.2.1, React Compiler rules on (no `setState` in effect bodies, no impure calls in render) |
| `next build` | PASS | All routes compile; `/api/*` are dynamic. Needs a well-formed `NEXT_PUBLIC_CHIPI_API_KEY` (inlined at build time). No secret needed to build: this app's server only issues JWTs |

## What the SDK was checked against (in `chipi-pay/sdks`, not by a run of this app)

- `backend/src/__tests__/cctp.test.ts`, `cctp-evm.test.ts`: encodings, the Starknet calls and the EVM calldata pinned against a real mainnet burn and Circle's attested messages; `depositFromEvm` on a scripted EIP-1193 provider (chain switch and refusal, allowance, EIP-5792 batch and fallback, fast `maxFee`, reverted burn).
- `chipi-react/src/hooks/__tests__/useCrossChainDeposit.test.ts`, `useCctpDepositStatus.test.ts`: the hooks' order of calls and error shapes.
- Read-only on Base mainnet, 2026-10-25: the SDK's `depositForBurn` calldata (1 USDC to a Starknet wallet, standard; and fast with `cctpMaxFee` at Circle's live 1.3 bps) simulated with `eth_call` on Circle's `TokenMessengerV2` from a real recent depositor: accepted, no revert. Controls: an amount over the allowance ("transfer amount exceeds allowance"), a zero recipient ("Mint recipient must be nonzero") and `maxFee ≥ amount` ("Max fee must be less than amount") reverted with Circle's own messages. The nonce the SDK's `decodeCctpMessage` reads from a real attested Starknet→Base message is marked used on Base's `MessageTransmitterV2`.
- Chipi's side: register-burn accepts only the caller's own wallets and the mint delivery re-attests expired messages ([chipi-pay/chipi-back#423](https://github.com/chipi-pay/chipi-back/pull/423)).

## Features Validation

| Feature | Status | Notes |
|---------|--------|-------|
| Anonymous account + JWT for Chipi (`/api/auth/anonymous`, `/api/auth/token`, `/api/auth/jwks`) | NOT RUN | Same code shape as tutorial 05's JWT, which was exercised there |
| Wallet creation with passkey (`usePasskey: true`) | NOT RUN | Needs a PRF-capable passkey in a browser |
| EVM wallet discovery (`discoverEvmWallets`) and connect | NOT RUN | Needs a browser with an EIP-6963 wallet |
| Quote both speeds (`quote`) | NOT RUN in this app | `cctpQuote` against Circle's live fee API is covered in the SDK tests with recorded responses; live fees read 2026-10-24: Base → Starknet fast 1.3 bps, standard 0 |
| Deposit, standard (`depositAsync`) | NOT RUN | Needs USDC and ETH on Base, 14.18.0 published and chipi-back #423 deployed |
| Deposit, fast | NOT RUN | Same |
| Close the page, resume (`useCctpDepositStatus`) | NOT RUN | Same |

## Hooks / Methods Exercised

| Hook/Method | Used in file | Works? |
|-------------|-------------|--------|
| useChipiWallet | app/components/tutorial.tsx | Not run |
| useCreateWallet | app/components/create-passkey-wallet.tsx | Not run |
| discoverEvmWallets | app/components/pick-evm-wallet.tsx | Not run (SDK tests) |
| cctpEvmChainByKey, encodeEvmBalanceOf | lib/base.ts | Not run (SDK tests) |
| useCrossChainDeposit (quote, depositAsync), CrossChainDepositError | app/components/fund-from-base.tsx | Not run (SDK tests) |
| formatCctpEta | app/components/fund-from-base.tsx, deposit-progress.tsx | Not run (SDK tests) |
| useCctpDepositStatus | app/components/deposit-progress.tsx | Not run (SDK tests) |

## Bugs Found

None in the SDK.

## Pending (live run on mainnet)

1. ~~Publish 14.18.0; `npm install` here; commit `package-lock.json`; rerun `tsc`, `eslint`, `next build`.~~ Done 2026-10-26 (table above).
2. ~~Merge chipi-back #423 (register-burn ownership check; the delivery task re-attests) and chipi-cctp-relayer #2.~~ Merged 2026-10-26; chipi-back deployed from main, the relayer is deployed by hand.
3. Register `${APP_URL}/api/auth/jwks` in the Chipi dashboard; create the passkey wallet.
4. Deposit 1 USDC from Base at standard speed, close the tab after the wallet confirms, come back: step 5 shows MINTED with the Starknet transaction; the Chipi wallet's USDC rose by 1.
5. Deposit 1 USDC fast: Circle's `feeExecuted` on the message equals the quoted fee; the wallet receives 1 − fee.

| Step | Burn tx (Base) | Mint tx (Starknet) | Result |
|------|----------------|--------------------|--------|
| 1 USDC, standard, page closed | | | |
| 1 USDC, fast | | | |

## Build Verification

```bash
git clone https://github.com/chipi-pay/build-with-chipi
cd build-with-chipi/tutorials/06-fund-from-base
npm install
npm run build  # with NEXT_PUBLIC_CHIPI_API_KEY set
```

- [x] Clean install works (14.18.0 from the registry, 2026-10-26)
- [x] Build passes (against the packed release branch on 2026-10-25, and against the published 14.18.0 on 2026-10-26)
- [ ] App runs at localhost (after the live run)

## Recording

- [ ] Video recorded: not yet; after the live run.
