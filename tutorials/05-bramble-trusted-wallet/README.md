# Tutorial 05: Bramble as a trusted wallet

Your users already have a Starknet wallet. Here it does four jobs for their Chipi wallet:

1. **Sign in.** Bramble signs a one-time message. No email, no password.
2. **Fund.** Bramble sends USDC to a new Chipi passkey wallet.
3. **Co-own.** Bramble's key becomes a second owner of that wallet, next to the passkey.
4. **Approve.** Bramble approves an agent's capped session key. Chipi relays it gaslessly, and Bramble's key never leaves Bramble.

Bramble is a browser-extension wallet (`window.starknet_bramble`). Braavos, Ready and other Chipi wallets work the same way; Bramble is the strictest, so code that works with it works with the others.

Requires `@chipi-stack/nextjs` and `@chipi-stack/backend` **14.17.0** or later (14.16.0 for sign-in only). Starknet **mainnet** only.

> Bramble co-signs through a signer kind, `STARK_SNIP12`, whose verifier class was declared on mainnet on 2026-10-14. The app still checks it with `isShhhVerifierDeclared` before step 5, so on a network without it the proposal stays disabled. New wallets (step 3) deploy SHHH V8.5.

## What runs where

| Step | Where | Signs with | Prompts |
|------|-------|-----------|---------|
| 2. Sign in | Browser + `POST /api/auth/verify` | Bramble (SNIP-12 message) | 1 Bramble |
| 3. Create the wallet | Browser | passkey (WebAuthn PRF) | 1 passkey |
| 4. Fund it | Browser | Bramble (invoke, pays STRK) | 1 Bramble |
| 5a. Read Bramble's key | Browser | Bramble (`Approval` typed data) | 1 Bramble |
| 5b. Propose Bramble as co-owner | Browser | passkey | 1 passkey |
| 5c. 48 hours later, add it | Browser | passkey | 1 passkey |
| 6. Approve / revoke an agent session | Browser + server check | Bramble (`Approval` typed data, relayed gaslessly) | 1 Bramble each |

The passkey's key never leaves the browser. Bramble's key never leaves Bramble. The agent's session key never leaves the server.

## 1. Set up

```bash
cd tutorials/05-bramble-trusted-wallet
npm install
cp env.example .env.local   # APP_URL, APP_SECRET, APP_JWT_PRIVATE_KEY, Chipi keys
npm run dev
```

Three things need a public **https** URL, so in development run the app behind a tunnel (`cloudflared tunnel --url http://localhost:3000`) and set `APP_URL` to it:

- Chipi fetches this app's JWKS from `${APP_URL}/api/auth/jwks`.
- The passkey is bound to the hostname you open the app on.
- Bramble injects its provider only on `https://` pages and on `localhost`.

In the [Chipi dashboard](https://dashboard.chipipay.com/configure/jwks-endpoint), register `${APP_URL}/api/auth/jwks`. The tokens are shaped like Better Auth's JWT plugin (RS256, one key, `iss` and `aud` = `APP_URL`, `sub` = the user id), so pick **Better Auth** as the provider.

Install Bramble in a Chromium browser, select **Starknet Mainnet**, and keep some **STRK** in the account: Bramble pays its own fees, and a new account's first transaction also deploys it.

## 2. Find Bramble and sign in with it

[`lib/bramble.ts`](./lib/bramble.ts) talks to `window.starknet_bramble` directly. Its provider can appear after the page loads, so wait for `starknet#initialized` before deciding it isn't installed:

```ts
export function waitForBramble(timeoutMs = 3000): Promise<Bramble | null> {
  // resolves on window.starknet_bramble, the starknet#initialized event, or the timeout
}
```

Bramble is strict, and every request in this tutorial follows its rules:

- **Prompts start from a click.** A prompt stays pending until the user decides. Don't auto-retry: Bramble allows 5 pending prompts per site.
- **Explicit params, no extra keys.** `{ silent_mode: false }`, never `undefined`.
- **Lowercase hex addresses.**
- **`113`** = the user declined (or the prompt expired). **`163`** = everything else: locked, site not connected, too many pending prompts, or refused by policy. `brambleErrorMessage` turns both into a sentence.
- **One account per site.** Before each request, `requireBrambleAccount` checks (silently, with `silent_mode: true`) that Bramble still shows the signed-in account.

Sign in with Starknet takes **two clicks** ([`app/components/sign-in-with-bramble.tsx`](./app/components/sign-in-with-bramble.tsx)): the first connects Bramble and fetches a nonce, the second asks for the signature. Each prompt gets its own click.

The server issues the message ([`app/api/auth/nonce/route.ts`](./app/api/auth/nonce/route.ts)) and checks it ([`app/api/auth/verify/route.ts`](./app/api/auth/verify/route.ts)):

```ts
const issued = consumeNonce(nonce); // once: a replayed signature finds no nonce
const result = await verifyStarknetSignIn({
  typedData: createStarknetSignInTypedData({ domain, uri: appUrl(), nonce, ...issued }), // rebuilt, never the client's
  signature,
  provider,
  expected: { domain, uri: appUrl(), nonce },
  deploymentData, // a new Bramble account isn't deployed yet
});
```

A deployed account answers through its own `is_valid_signature`. A brand-new Bramble account has no contract yet: the browser sends `wallet_deploymentData`, and the SDK checks the signature against the key in it.

On success the server sets a signed, httpOnly cookie, and the **Bramble address becomes the user id**: the JWT's `sub`, and Chipi's `externalUserId`.

**Auth here is deliberately minimal** ([`lib/auth.ts`](./lib/auth.ts)): nonces in memory, a stateless HMAC cookie, and an RS256 JWT signed with a key from `APP_JWT_PRIVATE_KEY` (`/api/auth/token`, published at `/api/auth/jwks`). In production use a real auth library with sessions in a database. With Better Auth, for example, sign-in with Starknet fits as a plugin: nonces in its `verification` table, the wallet linked as an account, and its JWT plugin for Chipi.

## 3. Create the Chipi wallet (passkey)

[`app/components/create-passkey-wallet.tsx`](./app/components/create-passkey-wallet.tsx)

```tsx
await createWalletAsync({
  params: { externalUserId: userId, chain: Chain.STARKNET, walletType: "SHHH", usePasskey: true },
  bearerToken,
});
```

Passkey only, no PIN: the passkey's PRF output encrypts the key, so neither Chipi, this app nor Bramble can decrypt it. On a device without WebAuthn PRF the hook throws with `code: "PRF_UNSUPPORTED"` instead of creating a wallet the server could decrypt.

Why not just use Bramble as the wallet? Only a Chipi wallet enforces an agent's caps on-chain (step 6). Bramble's default account (OpenZeppelin) has no session keys.

## 4. Fund it from Bramble

[`app/components/fund-from-bramble.tsx`](./app/components/fund-from-bramble.tsx) sends native USDC (`0x0330…35fb`, not USDC.e) with one `wallet_addInvokeTransaction`:

```ts
await bramble.request({
  type: "wallet_addInvokeTransaction",
  params: {
    // Exactly `calls`: a fee, max_fee or paymaster key fails with 114.
    calls: [{
      contract_address: USDC,
      entry_point: "transfer",
      calldata: [chipiWallet, amountLow, amountHigh], // u256 = low, high
    }],
  },
});
const receipt = await waitForTransaction(txHash); // a hash is not a result
```

Bramble estimates the fee and pays it in STRK; it has no dApp paymaster. The component checks for STRK before asking.

## 5. Make Bramble a co-owner

[`app/components/add-bramble-owner.tsx`](./app/components/add-bramble-owner.tsx)

### Why a new signer kind

Bramble signs with a STARK key, the same curve as the wallet's own `STARK` signer. But a browser wallet never signs a raw hash: `wallet_signTypedData` signs a SNIP-12 hash that always includes Bramble's own address. So the transaction hash is wrapped in a typed data Bramble signs as-is, and the `STARK_SNIP12` verifier rebuilds it on-chain:

```
StarknetDomain { name: "Shhh", version: "1", chainId: "SN_MAIN", revision: "1" }
Approval { Wallet: <the Chipi wallet>, Hash: <the transaction hash> }
```

A signature works for one Chipi wallet, one chain and one transaction. `SN_MAIN` is in the domain, as Bramble requires.

### (a) Read Bramble's key: one Bramble prompt

```ts
const messageHash = randomFelt(); // any fresh value: this signature only identifies the key
const signature = await signTypedData(bramble, starkSnip12ApprovalTypedData({ walletAddress, messageHash }));
const { starkPubkey, pubkeyFelts } = await resolveStarkSnip12Signer({
  provider,
  signerAddress: brambleAddress,
  walletAddress,
  messageHash,
  signature,
  deploymentData: await deploymentData(bramble), // a new account carries its key here
});
```

`resolveStarkSnip12Signer` reads the key from the deployment data (new account) or from `get_public_key` (deployed OpenZeppelin account, Bramble's default), and throws unless that key verifies the signature. It also handles Ready/Argent (the key is in the signature), Braavos (`get_signers`) and Chipi wallets (the owner record).

### (b) Propose: one passkey prompt

A Chipi wallet starts with the `STARK` verifier only. One owner-signed transaction proposes the new kind (if the wallet doesn't have it) and Bramble as an owner:

```ts
if (!(await isShhhVerifierDeclared(provider, "STARK_SNIP12"))) {
  // not declared on this network: never propose it, it could never verify
}
const calls = [];
if ((await readVerifierClass(provider, walletAddress, "STARK_SNIP12")) === 0n) {
  calls.push(buildProposeAddVerifierClassCall({ walletAddress, proposer: 0, kind: "STARK_SNIP12" }));
}
calls.push(buildProposeAddOwnerCall({
  walletAddress,
  proposer: 0, // the passkey is owner 0
  newOwner: { kind: "STARK_SNIP12", pubkeyBytes: pubkeyFelts, role: "OWNER", weight: 1, label: "bramble" },
}));
const txHash = await callAnyContractAsync({
  params: { usePasskey: true, externalUserId: userId, credentialId: wallet.credentialId ?? undefined, wallet, contractAddress: walletAddress, calls },
  bearerToken,
});
const ops = parseOpProposedEvents((await waitForTransaction(txHash)).events, walletAddress);
```

The op ids include the block time, so they come from the receipt. The app keeps the propose hash in `localStorage` and reads the ops back from it when you return.

### (c) 48 hours later: add it, one passkey prompt

Both proposals have a 48-hour timelock (`TIMELOCK_SECONDS.ADD_OWNER`). The page shows a countdown (`secondsUntilExecutable`). Any owner can cancel before execution. A proposal expires 14 days after it becomes executable (the event's `expiresAt`); the page then offers to propose again. Then one transaction executes both, **verifier first**: `execute_add_owner` checks Bramble's key through it.

```ts
const calls = [
  buildExecuteAddVerifierClassCall({ walletAddress, opId: addVerifier.opId, kind: "STARK_SNIP12" }),
  buildExecuteAddOwnerCall({ walletAddress, opId: addOwner.opId, newOwner }),
];
```

Bramble's index in the owner set is what it signs with. The app finds it with `readShhhOwners` and `starkSnip12OwnerCommitment(starkPubkey, brambleAddress)`.

## 6. Bramble approves an agent session

[`app/components/approve-agent-session.tsx`](./app/components/approve-agent-session.tsx), two clicks:

1. **Prepare.** The server creates the session keypair and keeps the encrypted private half ([`app/api/agent/session/route.ts`](./app/api/agent/session/route.ts)). The page shows the session and every cap.
2. **Approve with Bramble.** Session and caps in one Bramble signature:

```tsx
const { executeAsync } = useExternalSignerExecute();

const txHash = await executeAsync({
  params: {
    walletAddress,
    ownerIndex: owner.ownerId,
    calls: buildSessionSetupCalls(
      walletAddress,
      { sessionPublicKey, validUntil, maxCalls: MAX_CALLS, allowedEntrypoints: ALLOWED_ENTRYPOINTS },
      SPENDING_POLICIES, // a cap for every token, never maxPerWindow: 0
    ),
    signTypedData: (typedData) => signTypedData(bramble, typedData),
    signer: { address: userId, starkPubkey: owner.starkPubkey }, // checked off-chain before relaying
  },
  bearerToken,
});
```

The server then waits for the transaction and reads `getSessionData(...).isActive` from the wallet contract before it trusts the session. **Revoke with Bramble** sends `buildRevokeSessionKeyCall` the same way.

No passkey prompt, and the wallet's key is never decrypted: Bramble's `Approval` signature is enough, because Bramble is an owner. On a server, `sdk.executeWithExternalSigner` takes the same input.

What the agent then does with its session is [tutorial 04](../04-agent-session-passkey), steps 5 and 6.

## 7. Going to production

- **Mainnet only.** Bramble's typed data must name its active chain; `connectBramble` refuses anything but `SN_MAIN`.
- **STRK for Bramble.** Funding and any Bramble invoke cost STRK. Chipi-relayed calls (step 6) cost the user nothing.
- **The declare.** Check `isShhhVerifierDeclared(provider, "STARK_SNIP12")` before offering step 5. Never propose a kind whose class isn't declared: the wallet would register a verifier that can never verify.
- **A co-owner has full control.** As an `OWNER`, Bramble can sign anything the passkey can: move funds, approve sessions, add or remove owners. A compromised Bramble is a compromised wallet. If the user only wants a backup, make Bramble a **`GUARDIAN`** (`role: "GUARDIAN"`): a guardian can only start a recovery, which anyone can finalize after 7 days unless an owner cancels it first. A guardian can't approve sessions, so step 6 needs the `OWNER` role. See the [Trusted wallets](https://docs.chipipay.com/sdk/guides/trusted-wallets) guide.
- **Bramble signs a hash.** It shows the wallet address and a hash, not the decoded calls. Show the calls in your own UI before asking, as step 6 does.
- **Real auth and storage.** Replace [`lib/auth.ts`](./lib/auth.ts) and the in-memory [`lib/agent-store.ts`](./lib/agent-store.ts) (a session table, nonces stored with an atomic consume, the JWT key in your secret manager). Keep the proposed op ids on the server too, not only in `localStorage`.
- **Watch for proposals.** Anyone with an owner key can propose a new owner; the 48-hour timelock is the user's window to cancel (`buildCancelPendingOpCall`). Alert users on every `OpProposed` event of their wallet.

## Related docs

- [Sign in with Starknet](https://docs.chipipay.com/sdk/guides/sign-in-with-starknet)
- [Trusted wallets](https://docs.chipipay.com/sdk/guides/trusted-wallets)
- [Multi-owner governance](https://docs.chipipay.com/sdk/guides/multisig-governance)
- [Agent with a session key and a passkey](https://docs.chipipay.com/sdk/guides/agent-sessions)
- [Spending policies](https://docs.chipipay.com/sdk/guides/spending-policies)
- [Connect with Chipi](https://docs.chipipay.com/sdk/connector/overview), and [tutorial 03](../03-connect-with-chipi) for Bramble as a connector
