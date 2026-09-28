# Tutorial 04: an agent with a session key and a passkey

Let a server-side agent trade from a user's **self-custodial** wallet without ever holding the user's key.

- The user hires the agent with **one passkey prompt** and stops it with another.
- In between, the agent signs with a **session key** that the wallet contract limits by itself: which functions it may call, how many times, until when, and how much of each token per call and per day.
- The agent decides with Chipi's AI API (`sdk.ai`) and checks every decision against your own limits before it moves anything.

Requires `@chipi-stack/nextjs` and `@chipi-stack/backend` **14.14.0** or later.

## What runs where

| Step | Where | Signs with | Prompts |
|------|-------|-----------|---------|
| Create the wallet | Browser | passkey (WebAuthn PRF) | 1 |
| Create the session keypair | Server (`POST /api/agent/session`) | nothing | 0 |
| Register the session **and** its caps | Browser (`registerSession`) | owner key, unlocked by the passkey | **1** |
| Decide and trade | Server (`POST /api/agent/tick`) | session key | 0 |
| Stop the agent | Browser (`revokeSession`) | owner key, unlocked by the passkey | **1** |

The owner key never leaves the browser. The session key never leaves the server.

## 1. Set up

```bash
cd tutorials/04-agent-session-passkey
npm install
cp env.example .env.local   # fill in Clerk + Chipi keys and AGENT_SESSION_SECRET
npm run dev
```

In the [Chipi dashboard](https://dashboard.chipipay.com), register Clerk's JWKS for your org, and add AI credits (the agent's decisions are billed to them).

## 2. Create a passkey wallet

[`app/components/create-passkey-wallet.tsx`](./app/components/create-passkey-wallet.tsx)

```tsx
const { encryptKey } = await createWalletPasskey(userId, userId); // Face ID / fingerprint
const bearerToken = await getToken({ skipCache: true });            // fresh, after the prompt
await createWalletAsync({
  params: { encryptKey, externalUserId: userId, chain: Chain.STARKNET, walletType: "SHHH" },
  bearerToken,
});
```

`createWalletPasskey` requires WebAuthn PRF. On a device without it, it throws `PrfUnsupportedError` instead of creating a wallet the server could decrypt. Show a "device not supported" message.

## 3. Decide the limits

[`lib/limits.ts`](./lib/limits.ts) holds every limit in one place:

- `ALLOWED_ENTRYPOINTS`: `approve`, `transfer` and `multi_route_swap` (AVNU). Names are converted to selectors by the SDK.
- `SPENDING_POLICIES`: a per-call and per-day cap for USDC, ETH and STRK.
- `MAX_TRADE_USD`: the largest swap the agent may ask for.

Two rules that are easy to get wrong:

- **The whitelist is not scoped to a contract.** `transfer` is allowed on every token the wallet holds, so set a cap for every token, not only the one you trade.
- **`maxPerWindow: 0n` means no cap.** Always use a positive value.

## 4. Hire the agent: one prompt

The server creates the session key and keeps the encrypted private half ([`app/api/agent/session/route.ts`](./app/api/agent/session/route.ts)):

```ts
const session = chipi.sessions.createSessionKey({
  encryptKey: agentSessionSecret(),
  durationSeconds: SESSION_SECONDS,
});
```

The browser registers it with the passkey ([`app/components/agent-panel.tsx`](./app/components/agent-panel.tsx)):

```tsx
const { registerSession } = useChipiSession({
  wallet,
  getEncryptKey: () => getWalletEncryptKey(),         // prompts only when an action runs
  getBearerToken: () => getToken({ skipCache: true }), // called after getEncryptKey
});

const txHash = await registerSession({
  sessionPublicKey,
  validUntil,
  maxCalls: MAX_CALLS,
  allowedEntrypoints: ALLOWED_ENTRYPOINTS,
  spendingPolicies: SPENDING_POLICIES, // same transaction: the session never exists without its caps
});
```

Then the server waits for that transaction and checks the chain (`getSessionData(...).isActive`) before it uses the session.

## 5. One decision

[`app/api/agent/tick/route.ts`](./app/api/agent/tick/route.ts) runs when you click **Run one decision**. In production, call it from a cron for every active agent.

1. Check that the session is still live on-chain (not expired, revoked or out of calls).
2. Read the balances.
3. `chipi.ai.think({ portfolio, riskScore: 3 })`.
4. **Validate.** `isThinkDecision` rejects a non-JSON reply or an unknown action. Only `swap` between tradable tokens goes through, and the amount is capped at `MAX_TRADE_USD` whatever the model said.
5. `chipi.ai.execute(...)` returns unsigned AVNU calls; `chipi.executeTransactionWithSession(...)` signs them with the session key.
6. `waitForTransaction(txHash)`: a hash is not a result. A swap above a cap reverts on-chain and shows up here as `success: false`.

## 6. Stop the agent: one prompt

```tsx
const txHash = await revokeSession(sessionPublicKey);
```

The browser never held the session, so it passes the public key. After revocation the contract zeroes the session: `getSessionData` reads `validUntil: 0`, and any later session-signed transaction fails.

## Going to production

- Replace the in-memory store in [`lib/agent-store.ts`](./lib/agent-store.ts) with a table.
- Keep `AGENT_SESSION_SECRET` in your secret manager; rotating it means re-hiring every agent.
- Cap deposits while you are in beta, and tell users the agent can lose money within its limits.
- If the agent pays for an API per call, verify each payment with `SessionTxVerifier` (see [the guide](https://docs.chipipay.com/sdk/guides/agent-sessions)).

## Related docs

- [Agent with a session key and a passkey](https://docs.chipipay.com/sdk/guides/agent-sessions)
- [useChipiSession](https://docs.chipipay.com/sdk/nextjs/hooks/use-chipi-session)
- [DeFi intelligence (AI API)](https://docs.chipipay.com/services/ai-api/defi-intelligence)
- [Spending policies](https://docs.chipipay.com/sdk/guides/spending-policies)
