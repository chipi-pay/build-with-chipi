# Validation Report — Tutorial 05: Bramble as a trusted wallet

**Tester:** Claude (agent session). Not yet reviewed.
**Date:** 2026-10-12
**Framework:** Next.js 16.2.1 (App Router)
**Auth Provider:** Custom: Sign in with Starknet (`verifyStarknetSignIn`) + an RS256 JWT served at `/api/auth/jwks`
**SDK Version:** `@chipi-stack/nextjs` / `@chipi-stack/backend` `^14.17.0` (published 2026-10-14; first checked against tarballs packed from source, see below)
**Tutorial Issue:** N/A

---

## Release check (2026-10-15)

14.17.0 was published on 2026-10-14, and the `StarkSnip12Verifier` class was declared on mainnet the same day (class `0x017884125977631bee198b34cd3e3fcf975a543e453c8b996a818910a964b5e`, block 16,377,651).

- `npm install` from the registry generated the committed `package-lock.json`: `@chipi-stack/backend`, `nextjs`, `chipi-react`, `shared` and `types` at 14.17.0, `core` at 0.6.2, `chipi-passkey` at 2.3.0, no local tarballs.
- `npx tsc --noEmit`, `npx eslint .` and `next build` pass against it (build with a well-formed placeholder `NEXT_PUBLIC_CHIPI_API_KEY` and `CHIPI_API_SECRET_KEY`).
- `isShhhVerifierDeclared` from the published 14.17.0, against mainnet: `STARK_SNIP12` → `true`, `STARK` → `true`. Step 5 is enabled.

## How it was first checked (pre-release)

On 2026-10-12, 14.17.0 was not on npm yet (`latest` was 14.16.0). The SDK was built and packed from `chipi-pay/sdks`, branch `feat/stark-snip12-trusted-wallets`, commit `ca4ed17` plus the uncommitted 14.17.0 work in that tree on 2026-10-12 (among others `backend/src/shhh/verifier-classes.ts`, which adds `isShhhVerifierDeclared`). The packages still carry their 14.16.0 version numbers: the version bump comes with the release.

```bash
# chipi-pay/sdks
for p in types shared core chipi-passkey backend chipi-react nextjs; do pnpm --filter ./$p build; done
for p in types shared core chipi-passkey backend chipi-react nextjs; do (cd $p && pnpm pack --pack-destination <scratch>/packs); done

# this tutorial: TEMPORARY package.json edit
#   dependencies:  @chipi-stack/backend, @chipi-stack/nextjs -> file:<scratch>/packs/*.tgz
#   overrides:     every @chipi-stack/* package -> the same tarballs (so no 14.16.0 comes from npm)
npm install
npx tsc --noEmit
npx eslint .
NEXT_PUBLIC_CHIPI_API_KEY=pk_prod_<32 chars> npx next build

# then: package.json restored to the ^14.17.0 pins, the generated package-lock.json deleted
```

No lockfile was committed from that run: one generated against local tarballs would point at paths that exist only on the machine that made them. The committed lockfile comes from the registry after the release (above).

| Check | Result | Notes |
|-------|--------|-------|
| `tsc --noEmit` | PASS | Against the packed 14.17.0 source. Every SDK import resolves |
| `eslint .` | PASS | `eslint-config-next` 16.2.1 |
| `next build` | PASS | All routes compile; `/api/*` are dynamic. Needs a well-formed `NEXT_PUBLIC_CHIPI_API_KEY` (inlined at build time; a malformed one fails prerendering with `Invalid API key format`). No secret needed to build |
| Sign in with Starknet, end to end on `next start` | PASS | Local script: a generated key as an **undeployed OpenZeppelin account** (Bramble's default class), real `/api/auth/nonce` → signature → `/api/auth/verify` against mainnet RPC (account not found → `deploymentData` path): 200 and session cookie set |
| Replayed sign-in | PASS | Same nonce and signature again: 401 |
| Tampered session cookie | PASS | `/api/auth/session` answers `address: null` |
| JWT for Chipi | PASS | `/api/auth/token`: RS256, `kid` found in `/api/auth/jwks`, signature verifies with that key, `sub` = Bramble address, `iss` = `aud` = `APP_URL`, 15 minutes |
| `resolveStarkSnip12Signer` for a new Bramble account | PASS | Same generated undeployed account signs `starkSnip12ApprovalTypedData`; the key comes from the deployment data with no RPC call. Domain is `{ name: "Shhh", version: "1", chainId: "SN_MAIN", revision: "1" }` |
| `isShhhVerifierDeclared` on mainnet | PASS | 2026-10-12: `STARK_SNIP12` → `false` (before the declare), `STARK` → `true`; step 5 showed the warning and stayed disabled. 2026-10-15: `STARK_SNIP12` → `true` |

## Features Validation

| Feature | Status | Notes |
|---------|--------|-------|
| Sign in with Bramble (SIWS) | PASS | Server side, with a generated account (above). Live Bramble signature: pending |
| JWT accepted by Chipi (dashboard Better Auth provider) | NOT RUN | Needs the JWKS registered for a real org |
| Wallet creation with passkey (`usePasskey: true`) | NOT RUN | Needs a PRF-capable passkey in a browser |
| Fund from Bramble (`wallet_addInvokeTransaction`, `waitForTransaction`) | NOT RUN | Needs Bramble with USDC and STRK on mainnet |
| Propose verifier class + owner (passkey) | NOT RUN | `STARK_SNIP12` declared 2026-10-14; needs the passkey wallet |
| Execute both after 48 h | NOT RUN | Needs the proposal, then 48 hours |
| Bramble approves a capped session (`useExternalSignerExecute`) | NOT RUN | Needs Bramble as co-owner |
| Bramble revokes it | NOT RUN | Same |

## Hooks / Methods Exercised

| Hook/Method | Used in file | Works? |
|-------------|-------------|--------|
| createStarknetSignInTypedData | app/api/auth/nonce/route.ts | YES (local SIWS run) |
| verifyStarknetSignIn | app/api/auth/verify/route.ts | YES (local SIWS run, undeployed path) |
| useCreateWallet | app/components/create-passkey-wallet.tsx | Not run |
| useChipiWallet | app/components/tutorial.tsx | Not run |
| waitForTransaction | app/components/fund-from-bramble.tsx, add-bramble-owner.tsx, app/api/agent/session/route.ts | Not run (SDK tests) |
| starkSnip12ApprovalTypedData | app/components/add-bramble-owner.tsx | YES (local) |
| resolveStarkSnip12Signer | app/components/add-bramble-owner.tsx | YES (local, undeployed OZ path) |
| isShhhVerifierDeclared | app/components/add-bramble-owner.tsx | YES (mainnet read) |
| readVerifierClass, readShhhOwners, starkSnip12OwnerCommitment | app/components/add-bramble-owner.tsx | Not run (SDK tests) |
| buildProposeAddVerifierClassCall, buildProposeAddOwnerCall | app/components/add-bramble-owner.tsx | Not run (SDK tests) |
| buildExecuteAddVerifierClassCall, buildExecuteAddOwnerCall | app/components/add-bramble-owner.tsx | Not run (SDK tests) |
| parseOpProposedEvents, secondsUntilExecutable | app/components/add-bramble-owner.tsx | Not run (SDK tests) |
| useCallAnyContract | app/components/add-bramble-owner.tsx | Not run |
| useExternalSignerExecute | app/components/approve-agent-session.tsx | Not run (SDK tests) |
| buildSessionSetupCalls, buildRevokeSessionKeyCall | app/components/approve-agent-session.tsx | Not run (SDK tests) |
| sessions.createSessionKey, sessions.getSessionData | app/api/agent/session/route.ts | Not run |

"SDK tests" means the method is covered in `chipi-pay/sdks` (`backend/src/__tests__/shhh-stark-snip12.test.ts`, `session-calls.test.ts`, `chipi-react/src/hooks/__tests__/useExternalSignerExecute.test.ts`), not by a run of this app.

## Bugs Found

None in the SDK. Notes for the release:

| Note | Repo | Issue | Status |
|------|------|-------|--------|
| `isShhhVerifierDeclared` (`backend/src/shhh/verifier-classes.ts`) was uncommitted in the SDK tree packed here. This tutorial imports it: it must ship in 14.17.0 | chipi-pay/sdks | — | Shipped in 14.17.0 |
| `@chipi-stack/*` package versions still read 14.16.0 in the source tree | chipi-pay/sdks | — | Resolved by the 14.17.0 release |

## Pending (live run on mainnet)

1. ~~Publish 14.17.0; `npm install` here; commit `package-lock.json`; rerun `tsc`, `eslint`, `next build`.~~ Done 2026-10-15.
2. Register `${APP_URL}/api/auth/jwks` in the Chipi dashboard and confirm Chipi accepts the token (`useChipiWallet` loads).
3. Sign in with a real Bramble account, once new (undeployed) and once deployed.
4. Create the passkey wallet; fund it with 1 USDC from Bramble.
5. Propose (`STARK_SNIP12` is declared), wait 48 h, execute; Bramble appears in `readShhhOwners`.
6. Bramble approves the session (one signature), the server reads it active; Bramble revokes it.

| Step | Tx hash | Result |
|------|---------|--------|
| Fund 1 USDC from Bramble | | |
| Propose (verifier + owner) | | |
| Execute (verifier, then owner) | | |
| Bramble approves the session + 3 policies | | |
| Bramble revokes it | | |

## Build Verification

```bash
git clone https://github.com/chipi-pay/build-with-chipi
cd build-with-chipi/tutorials/05-bramble-trusted-wallet
npm install
npm run build  # with NEXT_PUBLIC_CHIPI_API_KEY set
```

- [x] Clean install works (from the registry, 2026-10-15)
- [x] Build passes (against the published 14.17.0)
- [x] App runs at localhost (`next start`, auth routes exercised)

## Recording

- [ ] Video recorded: not yet; after the live run.
