# Validation Report — Tutorial 04: agent with a session key and a passkey

**Date:** 2026-10-06 (first report 2026-09-29)
**Framework:** Next.js 16.2.1 (App Router)
**Auth Provider:** Clerk
**SDK Version:** `@chipi-stack/nextjs` / `@chipi-stack/backend` 14.15.1, installed from npm (`package-lock.json` resolves to registry.npmjs.org).

## What was checked

| Check | Result | Notes |
|-------|--------|-------|
| `tsc --noEmit` | PASS | Against the published 14.15.1 types (2026-10-06) |
| `eslint` | PASS | 14.15.1 (2026-10-06) |
| `next build` | PASS | All routes compile; `/api/agent/*` are dynamic. The build needs the `NEXT_PUBLIC_*` values (inlined at build time); run with placeholder public keys, no secrets. The server SDK is created on the first request, so the secret key is not needed to build |
| SDK flow on mainnet (`setupSession` → session-signed call → revoke) | **PASS** | `pnpm smoke:session-setup` in `chipi-pay/sdks`, 2026-09-29, fresh SHHH V8.4 wallet against staging ([run](https://github.com/chipi-pay/sdks/actions/runs/36627421432)) |
| x402: a payer outside the `sk_`'s org is refused before paying (14.15.1) | **PASS** | 2026-10-06, production, `sk_` of an org with no AI credits and a wallet of another org: the 402 offer answered `extra.payer.accepted: false` and `ai.think({ payWithSession })` threw `X402_PAYER_NOT_IN_ORG` with no transaction sent |
| Mainnet run of this app (hire → decide → stop) | **PENDING** | Needs a browser with a PRF-capable passkey and real Clerk + Chipi keys; fill in the table below after the run |

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
| Over-cap swap is refused (success, nothing moved, recorded as failed) | | |
| Decision paid over x402 (org without AI credits) | | |
| Stop | | |
