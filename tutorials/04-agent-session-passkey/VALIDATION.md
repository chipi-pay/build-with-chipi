# Validation Report — Tutorial 04: agent with a session key and a passkey

**Date:** 2026-09-28
**Framework:** Next.js 16.2.1 (App Router)
**Auth Provider:** Clerk
**SDK Version:** `@chipi-stack/nextjs` / `@chipi-stack/backend` 14.14.0, installed from the release-candidate tarballs of `chipi-pay/sdks` `feat/sessions-shhh-passkey` (not yet on npm).

## What was checked

| Check | Result | Notes |
|-------|--------|-------|
| `tsc --noEmit` | PASS | Against the packed 14.14.0 types |
| `eslint` | PASS | |
| `next build` | PASS | All routes compile; `/api/agent/*` are dynamic |
| SDK flow on mainnet (`setupSession` → session-signed call → revoke) | **PASS** | `pnpm smoke:session-setup` in `chipi-pay/sdks`, 2026-09-29, fresh SHHH V8.4 wallet against staging ([run](https://github.com/chipi-pay/sdks/actions/runs/36627421432)) |
| Mainnet run of this app (hire → decide → stop) | **PENDING** | Needs a browser passkey and the published 14.14.0 packages. Run it once 14.14.0 is on npm, then fill in the table below |

## SDK surface exercised

| Hook / method | File | Covered by SDK tests |
|---------------|------|----------------------|
| `createWalletPasskey`, `PrfUnsupportedError` | `app/components/create-passkey-wallet.tsx` | chipi-passkey |
| `useCreateWallet` (`walletType: "SHHH"`) | `app/components/create-passkey-wallet.tsx` | chipi-react |
| `useChipiSession` with `getEncryptKey` | `app/components/agent-panel.tsx` | `useChipiSession.passkey.test.ts` |
| `registerSession({ sessionPublicKey, validUntil, spendingPolicies })` | `app/components/agent-panel.tsx` | `useChipiSession.passkey.test.ts`, `session-calls.test.ts` |
| `revokeSession(sessionPublicKey)` | `app/components/agent-panel.tsx` | `useChipiSession.passkey.test.ts` |
| `sessions.createSessionKey`, `sessions.getSessionData` | `app/api/agent/*` | backend `sessions.test.ts`, `session-codec.test.ts` |
| `ai.think`, `ai.execute`, `isThinkDecision` | `app/api/agent/tick/route.ts` | `ai.test.ts` |
| `executeTransactionWithSession`, `waitForTransaction` | `app/api/agent/tick/route.ts` | backend tests |

## Mainnet run (to fill in)

| Step | Tx hash | Result |
|------|---------|--------|
| Create wallet | | |
| Hire (session + 3 policies, one tx) | | |
| One decision | | |
| Over-cap swap reverts | | |
| Stop | | |
