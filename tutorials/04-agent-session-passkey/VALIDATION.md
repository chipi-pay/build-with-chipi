# Validation Report — Tutorial 04: agent with a session key and a passkey

**Date:** 2026-09-29
**Framework:** Next.js 16.2.1 (App Router)
**Auth Provider:** Clerk
**SDK Version:** `@chipi-stack/nextjs` / `@chipi-stack/backend` 14.14.0, installed from npm (`package-lock.json` resolves to registry.npmjs.org).

## What was checked

| Check | Result | Notes |
|-------|--------|-------|
| `tsc --noEmit` | PASS | Against the published 14.14.0 types |
| `eslint` | PASS | |
| `next build` | PASS | All routes compile; `/api/agent/*` are dynamic. The build needs the `NEXT_PUBLIC_*` values (inlined at build time); run with placeholder public keys, no secrets. The server SDK is created on the first request, so the secret key is not needed to build |
| SDK flow on mainnet (`setupSession` → session-signed call → revoke) | **PASS** | `pnpm smoke:session-setup` in `chipi-pay/sdks`, 2026-09-29, fresh SHHH V8.4 wallet against staging ([run](https://github.com/chipi-pay/sdks/actions/runs/36627421432)) |
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
