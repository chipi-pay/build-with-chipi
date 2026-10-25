# Changelog

All notable changes to the `@chipi-stack` SDK packages are documented here.

## v14.18.0 (unreleased, date TBD)

Fund a Chipi wallet from any chain. A user with native USDC on **Base** (or Arbitrum, Optimism, Polygon or Ethereum) brings it into their Chipi wallet on Starknet through Circle's Cross-Chain Transfer Protocol (CCTP V2), and sends it back out, with one hook each: USDC is burned on one chain and minted on the other by Circle, no bridge token and no custodian. The app shows both speeds and prices before anything is signed, the Starknet mint is paid by Chipi, and a deposit completes even if the user closes the page. Everything is additive: 14.17.x code keeps working unchanged.

Walkthrough: [tutorial 06](./tutorials/06-fund-from-base) (a passkey wallet funded from Base: quote both speeds, burn, close the page, follow it from any device).

### `@chipi-stack/chipi-react` (and `nextjs`)

- **`useCrossChainDeposit()`**: `quote({ chain, amount })` returns both speeds (fee in bps and USDC, net amount, ETA) from Circle's live fee API; `depositAsync` burns through the user's EVM wallet (any EIP-1193 provider; one prompt when the wallet batches with EIP-5792, two otherwise), registers the burn with Chipi the moment its hash exists, waits for Chipi's mint on Starknet and records the deposit in the wallet's history. `onStatus` reports each step with how long it usually takes. The recipient is always the Chipi wallet and is checked before signing. A `CrossChainDepositError` carries the `burnTxHash`: the USDC left the source chain and is in flight, not lost.

  ```tsx
  const { quote, depositAsync } = useCrossChainDeposit();
  const quotes = await quote({ chain: BASE, amount: "25" }); // quotes.standard (free), quotes.fast (Circle's fee)
  await depositAsync({
    provider: evmWallet.provider,
    chain: BASE,
    amount: "25",
    walletAddress: chipiWallet.publicKey,
    finality: "standard",
    getBearerToken,
    onStatus: ({ step, eta }) => setStatus(`${step}: ${formatCctpEta(eta)}`),
  });
  ```
- **`useCctpDepositStatus({ burnTxHash })`**: `PENDING` | `MINTED` (with `mintTx`) | `FAILED` | `UNREGISTERED`, polled while pending. Keep the burn hash and a deposit can be followed on any device.
- **`useCrossChainWithdraw()`**: quote with Chipi (Circle's fast fee and whether Chipi pays it back for this user), burn on Starknet with the wallet's own signer (passkey or `encryptKey`), wait, record, and have Chipi's relayer deliver on the destination chain. Always fast finality: a standard transfer out of Starknet waits hours for the L1 proof. The destination address is checked (hex, non-zero, EIP-55 when mixed case) before signing.

### `@chipi-stack/backend`

- **`ChipiSDK.registerCctpDeposit`, `getCctpDepositStatus`, `recordCrossChainDeposit`, `quoteCrossChainWithdrawal`, `recordCrossChainWithdrawal`, `finalizeCrossChainWithdrawal`**: the chipi-back endpoints behind the hooks, for servers (secret key) or browsers (bearer token).
- **Building blocks**, browser-safe: `CCTP_EVM_CHAINS` / `cctpEvmChainByKey` (Base, Arbitrum, Optimism, Polygon, Ethereum: chain id, Circle domain, native USDC, explorer; `verified: true` marks Base, where Chipi has run real transfers), `CCTP_STARKNET` (Circle's `TokenMessengerMinterV2`, `MessageTransmitterV2`, native USDC, domain 25); `cctpQuote`, `cctpRoute`, `cctpAttestationEta`, `cctpStepEta`, `formatCctpEta` (fees and attestation times per source chain and finality); `depositFromEvm`, `discoverEvmWallets` (EIP-6963); `buildCctpWithdrawToEvmCalls`, `buildCctpWithdrawCalls`, `cctpMaxFee`, `buildCctpReceiveMessageCall`; `starknetAddressToMintRecipient`, `assertMintRecipient`, `evmAddressToMintRecipient`, `assertEvmAddress`, `parseUsdc`, `formatUsdc`; `decodeCctpMessage`, `isCctpMessageExpired`.

### `@chipi-stack/types`, `@chipi-stack/shared`

- `CctpEvmChain`, `CctpFinality`, `CctpDepositStatus`, `RegisterCctpDepositParams`, `RecordCrossChainDepositParams`, `QuoteCrossChainWithdrawalParams`, `CrossChainWithdrawalQuote`, `RecordCrossChainWithdrawalParams`, `CrossChainWithdrawalRecord`, `FinalizeCrossChainWithdrawalParams`; `API_ENDPOINTS.CCTP`.

### Who pays

- Depositing: the user pays gas on the source chain (cents on an L2). **Standard** is free and takes about 15–20 minutes from an L2 (Circle waits for Ethereum finality). **Fast** takes about a minute for Circle's fee (1.3 bps from Base on 2026-10-24), taken from the amount and shown before signing. Chipi pays the Starknet mint.
- Withdrawing: no gas (Chipi's paymaster); Circle's fast fee out of Starknet (12 bps), paid back to the recipient by Chipi under its sponsorship policy (`quoteCrossChainWithdrawal` says whether it is for this user).

### Docs

- New [Cross-chain USDC](https://docs.chipipay.com/sdk/guides/cross-chain-usdc) guide, hook pages for `useCrossChainDeposit`, `useCctpDepositStatus` and `useCrossChainWithdraw` (Next.js and React), the six endpoints in the API reference (Cross-chain), and v14.18.0 release notes.

### Not in this release

Solana (coming as an optional entry point), Expo (`depositFromEvm` needs a browser EIP-1193 provider), Python. Arbitrum, Optimism, Polygon and Ethereum are wired and listed but not yet exercised end to end by Chipi (`verified: false`).

### Verification

Unit tests in `chipi-pay/sdks` pin the encodings, the Starknet calls and the EVM calldata against a real mainnet burn and Circle's attested messages for it, run `depositFromEvm` on a scripted EIP-1193 provider (chain switch and refusal, allowance, EIP-5792 batch and fallback, fast `maxFee`, reverted burn), and cover the three hooks and every `ChipiSDK` method's HTTP request. Every address in `CCTP_EVM_CHAINS` answered `eth_getCode` with bytecode on 2026-10-24. On 2026-10-25 the SDK's `depositForBurn` calldata was simulated with `eth_call` on Base's `TokenMessengerV2` from a real depositor (standard, and fast with the quoted fee: accepted; over-allowance, zero recipient and `maxFee ≥ amount`: reverted with Circle's own messages). Tutorial 06 type-checks, lints and builds against tarballs packed from the release branch. Pending: a $1 live deposit through tutorial 06 after the publish.

## v14.17.2 (2026-10-23)

Recovery support, all additive.

### `@chipi-stack/backend`

- `updateWalletEncryption` accepts optional `credentialId`, `prfSupported` and `authMethod`, so a wallet record can point at the passkey that now encrypts the key (after a migration or a recovery). They are sent only when set: without them the request body is exactly what earlier versions send.
- `ChipiSDK.executeWithStarkKey` and the `useStarkKeyExecute` hook (React, Next.js): run calls signed by a STARK key at a given owner index. Every other signing path signs as owner 0; this is for the key a guardian recovery adds, which then rotates owner 0 onto a fresh key.
- `ChipiSDK.finalizeRecovery`: finalize a guardian recovery after its 7 days, gaslessly and with no signature (`POST /transactions/finalize-recovery`).
- `ChipiSDK.updateWalletEncryption`: the wallet-record update for servers (uses the secret key when no bearer token is passed).
- `createStarkOwnerKey(encryptKey)`: a fresh STARK owner key, returned only encrypted (`{ publicKey, encryptedPrivateKey }`).
- `rotateOwnerPayload(ownerId, newPubkeyHash)` and `removeOwnerPayload(ownerId)`: the payloads `ROTATE_OWNER` and `REMOVE_OWNER` ops commit to, pinned against the contract, so an app can check what a proposal does from its `OpProposed` event.

### `@chipi-stack/chipi-react`, `nextjs`, `chipi-expo`

- `useMigrateWalletToPasskey` also records the new passkey's `credentialId` and `prfSupported`. Before, a migrated wallet kept the old passkey id, so another device couldn't find the passkey that unlocks it.

## v14.17.1 (2026-10-16)

### `@chipi-stack/backend`

- SHHH governance reads: `readPendingOp(provider, wallet, opId)` returns an op's on-chain state (`executed`, `cancelled`, `validAfter`, `expiresAt`, `payload`), or `null` if the wallet has no such op. `addOwnerPayload(newOwner)` returns the payload an `ADD_OWNER` op commits to, so an app can check which owner a proposal adds (it matches `ShhhAccount`'s `_payload_add_owner`, pinned against snforge). `decodeShhhPendingOp` and the `ShhhPendingOp` type are exported too.

## v14.17.0 (2026-10-14)

New SHHH wallets deploy **V8.5**, which enforces the threshold when one owner signs alone (V8.4 ignored it there; no mainnet wallet was affected, since none had a threshold above 1). Bramble, the Starknet browser-extension wallet, becomes a first-class example. A user's own Starknet wallet (Bramble, Braavos, Ready, or another Chipi wallet) can co-own or guard their Chipi wallet: it keeps its key, approves with `wallet_signTypedData`, and Chipi relays gaslessly. Connect with Chipi sits quietly next to Bramble. Everything else is additive: 14.16.x code keeps working unchanged.

Walkthroughs: [tutorial 05](./tutorials/05-bramble-trusted-wallet) (sign in, fund, co-own, approve an agent session with Bramble) and [tutorial 03](./tutorials/03-connect-with-chipi) (Bramble next to Chipi in one connector list).

> **Both classes are on mainnet.** `ShhhAccount` V8.5 (`0x067828c8b82ac723b4adb141f9aa8975e296d8c11179d22bb8d7203b32abd96a`, block 16375744) and `StarkSnip12Verifier` (`0x017884125977631bee198b34cd3e3fcf975a543e453c8b996a818910a964b5e`, block 16377651), both declared 2026-10-14.

### `@chipi-stack/backend`

- **New SHHH wallets deploy V8.5.** `createWallet` computes the address with V8.5, names that class in `prepare-creation`, and stops with `Not deploying` if the API answers with another class. Existing V8.4 wallets keep working and still resolve as `SHHH`. On-chain N-of-M needs V8.5: Chipi's API keeps V8.4 thresholds at 1 (`422 SHHH_THRESHOLD_UNSUPPORTED`). Record: [`v8-5-audit-entry.md`](https://github.com/haycarlitos/shhh-wallet-cairo/blob/v8-robust/docs/v8-5-audit-entry.md).

- **Trusted wallets: the `STARK_SNIP12` signer kind.** A browser wallet never signs a raw hash: `wallet_signTypedData` always folds in its own address, so the wallet's `STARK` signer can't check it. `STARK_SNIP12` checks a STARK signature over an `Approval { Wallet, Hash }` typed data instead (domain `Shhh`, revision 1, `chainId` `SN_MAIN`, plain ASCII: Bramble's rules). A signature is good for one Chipi wallet, one chain and one transaction.
  - `starkSnip12ApprovalTypedData`, `starkSnip12ApprovalHash`, `starkSnip12PubkeyFelts`, `starkSnip12OwnerCommitment`, `buildStarkSnip12Envelope`, `verifyStarkSnip12Approval`.
  - `parseStarknetWalletSignature` reads `[r, s]` (Bramble's OpenZeppelin account, Braavos), `[1, 0, pubkey, r, s]` (Ready / Argent) and a Chipi wallet's own envelope. Multisig, hardware and passkey signers are refused.
  - `resolveStarkSnip12Signer` finds which key signs for the external wallet from one approval signature: the key in the signature (Ready), `get_public_key` (Bramble), `get_signers` (Braavos), a Chipi wallet's owner record, or `wallet_deploymentData` for a new account that isn't deployed yet. It throws unless that key verifies the signature.
- **`sdk.executeWithExternalSigner`**: run calls on a SHHH wallet approved by an external owner, relayed through Chipi's paymaster. Pass the wallet's `wallet_signTypedData` as `signTypedData`, and `signer: { address, starkPubkey }` to check the signature off-chain before relaying. Lower level: `prepareExternalOwnerExecution` / `submitExternalOwnerExecution` (`executeShhhWithExternalSigner` does both).

  ```ts
  const txHash = await sdk.executeWithExternalSigner({
    params: {
      walletAddress: chipiWallet.publicKey,
      ownerIndex: brambleOwnerId,
      calls: buildSessionSetupCalls(chipiWallet.publicKey, sessionConfig, spendingPolicies),
      signTypedData: async (typedData) =>
        (await bramble.request({ type: "wallet_signTypedData", params: typedData })) as string[],
    },
    bearerToken,
  });
  ```
- **`executeShhhWithStarkKey`**: sign as a non-primary STARK owner, for the rotation that follows a guardian recovery.
- **Verifier classes on a deployed wallet.** A wallet only verifies the kinds it has registered (a passkey wallet starts with `STARK`). `buildProposeAddVerifierClassCall` / `buildExecuteAddVerifierClassCall` add one through the 48-hour timelock, with no redeploy or upgrade. Propose it in the same owner-signed transaction as `buildProposeAddOwnerCall`, and execute it **before** `buildExecuteAddOwnerCall`, which checks the new key through the verifier. `isShhhVerifierDeclared` tells you whether the class exists on the network.
- **Readers**: `readShhhOwners` (every owner and guardian, with its index), `readVerifierClass`, `readPendingRecovery`, and `parseOpProposedEvents` (op ids include the block time, so they come from the propose receipt).
- **Sign in with Starknet accepts mainnet's chain id in felt form.** `verifyStarknetSignIn` takes the domain `chainId` as `SN_MAIN` or its felt (`0x534e5f4d41494e`, any padding or case, or decimal), since wallets echo either and SNIP-12 hashes them the same. Any other chain is still `WRONG_CHAIN`.

### `@chipi-stack/chipi-react` (and `nextjs`)

- **`useExternalSignerExecute()`**: `sdk.executeWithExternalSigner` as a mutation hook, re-exported by `@chipi-stack/nextjs`. Returns the tx hash: wait for it.
- `useChipiWalletObject` answers `wallet_deploymentData` with `116` ("deployment data not available") instead of always `115`; `115` only when the host passes `isDeployed: true`.

### `@chipi-stack/types`, `@chipi-stack/shared`

- `STARK_SNIP12` in `ShhhSignerKind`, its verifier class hash (`StarkSnip12Verifier`, `0x017884125977631bee198b34cd3e3fcf975a543e453c8b996a818910a964b5e`, declared 2026-10-14) and gas overhead.
- `WALLET_CLASS_HASHES.SHHH` is V8.5; V8.4 moves to `LEGACY_SHHH_CLASS_HASHES`.

### `@chipi-stack/core`

- x402: `X402Client` reads an Argent / Ready signature (`[1, 0, pubkey, r, s]`) as `r = sig[3]`, `s = sig[4]`. It read the first two felts, so those payments carried `r = 1, s = 0` and could never verify. `[r, s]` (OpenZeppelin, Braavos, Bramble) is unchanged.

### `@chipi-stack/starknet-connector` 0.5.0

- **Chipi next to Bramble.** Wallet scanners (get-starknet v4 `getAuthorizedWallets` / `getLastConnectedWallet`) call passive methods on every `window.starknet*` object at page load. Until the user connects, Chipi now answers them itself instead of trying to open its popup outside a click: `wallet_getPermissions` → `[]`, `wallet_requestAccounts` with `silent_mode: true` → `[]`, `wallet_requestChainId` → `SN_MAIN`.
- `chipi({ transport: { requestTimeoutMs } })` type-checks without repeating `walletUrl`.
- **Upgrade with `^0.5.0`.** On a `0.x` version a caret never crosses a minor: `^0.4.0` stays on 0.4.

```tsx
import { InjectedConnector } from "@starknet-react/core";
import { chipi } from "@chipi-stack/starknet-connector";

const connectors = [
  chipi(),
  // starknet-react 5 has no bramble() and injected() takes only { id }
  new InjectedConnector({ options: { id: "bramble", name: "Bramble" } }),
];
```

### Docs

- New [Trusted wallets](https://docs.chipipay.com/sdk/guides/trusted-wallets) guide (co-owner vs guardian, propose → 48 h → execute, recovery) and v14.17.0 release notes, with Bramble as the example wallet.
- [Sign in with Starknet](https://docs.chipipay.com/sdk/guides/sign-in-with-starknet): Bramble end to end (late injection, click-only prompts, mainnet check, deployment data, error codes 113 / 163), `MALFORMED` and both sources of `ADDRESS_MISMATCH`.
- Recovery, threshold and multi-owner governance pages corrected against the contract: recovery **adds** an owner and never replaces one; `cancel_recovery` takes the cancelling owner's id and guardians can't cancel; every `execute_*` call is permissionless after its timelock; a new signer kind needs its verifier class first.
- Connector docs show Chipi next to Bramble, Ready and Braavos and list every error the connector returns. SignerAdapter and TxBuilder pages no longer show a browser wallet signing a raw hash.

### Verification

Unit tests in `chipi-pay/sdks` cover the approval hash against the Cairo fixture, every signature shape, `resolveStarkSnip12Signer` for OpenZeppelin, Argent, undeployed OpenZeppelin, Braavos and Chipi wallets, the external-owner relay calldata, the verifier-class builders, `parseOpProposedEvents`, `readShhhOwners`, `isShhhVerifierDeclared` and the connector's passive answers. Tutorials 03 and 05 type-check and build against tarballs packed from the release branch; tutorial 05's sign-in, JWT and key resolution were exercised locally with a generated undeployed OpenZeppelin account. On 2026-10-12 `STARK_SNIP12` read as not declared on mainnet. Pending: a live run with Bramble on mainnet after the publish and the declare.

## v14.16.0 (2026-10-11)

Sign in with Starknet, a deny-by-default Connect with Chipi wallet object, and dApp sessions that carry their spend caps. Bramble, Braavos and Ready users can sign in with the wallet they already have.

### `@chipi-stack/backend`

- **Sign in with Starknet.** `createStarknetSignInTypedData` builds a SNIP-12 login message with a one-time nonce (revision 1, `SN_MAIN`, single-line printable ASCII: what every wallet, Bramble included, accepts). `verifyStarknetSignIn` checks chain, domain, URI, nonce, expiry and the signature, rebuilding the typed data from its message so a client can't swap in other types or a testnet domain.
  - **Deployed accounts** answer through their own `is_valid_signature`; only `'VALID'` counts (an account answering `0` or reverting is refused).
  - **Accounts not deployed yet** (new Bramble and Ready accounts: OpenZeppelin 3.0, Argent 0.4 without a guardian) are checked off-chain from `wallet_deploymentData`: known class, address matches the constructor, owner key signed. Anything else gets `UNSUPPORTED_ACCOUNT_CLASS`.
  - Lower level: `isValidStarknetSignature` and `verifyUndeployedStarknetSignature`.

  ```ts
  const result = await verifyStarknetSignIn({
    typedData, // rebuilt from the nonce you issued
    signature, // from bramble.request({ type: "wallet_signTypedData", params: typedData })
    provider,
    expected: { domain: "app.example.com", uri: "https://app.example.com", nonce },
    deploymentData, // bramble.request({ type: "wallet_deploymentData" }) for a new account
  });
  ```
- **x402 facilitator.** With a `provider`, the signature check accepts only `'VALID'` and names an undeployed payer. A SHHH payment must sign exactly one `transfer` of the declared `amount` of `asset` to `toAddress`; before, any non-empty call list passed, so a payer could declare 1 USDC and sign 1 base unit. A malformed payload is refused instead of throwing.

### `@chipi-stack/chipi-react` (and `nextjs`)

- **Connect with Chipi is deny-by-default.** `createChipiWindowObject` / `useChipiWalletObject` refuse every approval without `requestApproval` (they auto-approved before). `wallet_requestAccounts` asks for a connect approval once per wallet object; `silent_mode` and `wallet_getPermissions` reveal nothing before it. `wallet_signTypedData` refuses a domain for another chain.
- **dApp sessions carry their caps.** A dApp-proposed session with `spendCaps` is registered with its spending policies in one owner-signed transaction (`sessions.setupSession`). `spendCaps` also takes `{ token, maxPerCall, maxPerWindow, windowSeconds }`; a cap of 0 (unlimited on-chain) is refused.
- `wallet_deploymentData` answers `115` only when the host reports the account deployed; other failures are no longer disguised as "already deployed".

### `@chipi-stack/core` 0.6.1

- x402: the payment typed data declares SNIP-12 revision 1. Without it starknet.js refused to hash it, so accounts couldn't sign payments.

### `@chipi-stack/starknet-connector` 0.4.0

- **Hardening.** Messages that don't come from the wallet window the connector opened are ignored, before it opens and after it closes. Requests time out (`transport.requestTimeoutMs`, default 120 s) with `REQUEST_TIMEOUT`. A request after the user closed the wallet window rejects with `POPUP_CLOSED` instead of opening a popup outside a click.
- Account and network changes emit starknet-react `change` / `disconnect` events. `connect({ chainIdHint })` rejects non-mainnet with `UNSUPPORTED_CHAIN`. `disconnect()` removes the window registration.
- **Wallet Standard.** `registerChipiStandardWallet()` / `createChipiStandardWallet()` make Chipi discoverable by get-starknet v6 and `@starknet-start/react`.

### Docs

- New [Sign in with Starknet](https://docs.chipipay.com/sdk/guides/sign-in-with-starknet) guide.
- Connector security and API pages, and the transfer and call-any-contract snippets, now match the code; the x402 server example passes a `provider`.

### Verification

Unit tests cover SIWS typed data hashing under starknet.js, the ASCII, nonce and time guards, deployed accounts (only `'VALID'` accepted), undeployed OpenZeppelin `[r, s]` and Argent `[1, 0, pub, r, s]` signatures with generated keys, address mismatch, unknown class and guardian refusal, and every wrong domain, URI, nonce or chain. The account classes are the ones the Bramble extension 0.10.5 deploys. Live wallet signatures were not part of this release's checks.

## v14.15.1 (2026-10-06)

### `@chipi-stack/backend`

- **`sdk.ai.think(params, { payWithSession })` no longer pays from a wallet the API would refuse.** Chipi accepts an x402 payment only from a wallet of the organization that owns the `sk_` (`PAYER_NOT_IN_ORG`), and in 14.15.0 that refusal came after the USDC had moved. The first request now names the paying wallet in an `X-PAYER` header; when the offer's `extra.payer` answers `accepted: false`, `think` throws `X402_PAYER_NOT_IN_ORG` (402) and nothing is paid. An API that does not answer `X-PAYER` leaves `extra.payer` unset, and the SDK pays as in 14.15.0.

### Docs

- The agent-sessions guide's tick checked `receipt.success` alone. A session call the wallet refuses comes back `success: true` with nothing moved, so the example now also requires a `Transfer` from or to the wallet.
- Passkey-only wallets are documented as the self-custodial default, with unlocking on a new device from the wallet row's `credentialId` and `prfSupported`.

### Verification

Unit tests cover `X-PAYER` and the refusal. Live on 2026-10-06 against production, with an org that has no AI credits and a wallet of another org: the offer answered `accepted: false`, and `think` threw `X402_PAYER_NOT_IN_ORG` without sending any transaction.

## v14.15.0 (2026-10-04)

An agent can pay for Chipi's AI API from its session key, per call, over x402. Everything is additive: no default changes, and 14.14.x code keeps working unchanged.

Walkthrough: [tutorial 04](./tutorials/04-agent-session-passkey), step 5.3, and the [x402 with sessions](https://docs.chipipay.com/sdk/guides/x402-sessions) guide.

### `@chipi-stack/backend`

- **`sdk.ai.think(params, { payWithSession })`** pays only when `/v1/ai/think` answers 402 with an x402 `session-transfer` offer (credits short, x402 on). It sends a session-signed USDC `transfer` to the offer's `payTo`, waits for the receipt, and sends the same call again with `X-PAYMENT`. With credits, nothing is paid and the call behaves as in 14.14.
- **It refuses before paying:** a price above `maxAmount` (`X402_PRICE_ABOVE_MAX`), a model the offer does not list (`X402_MODEL_NOT_PAYABLE`), an input over `maxPromptBytes` (`X402_PAYLOAD_TOO_LARGE`), or a `maxAmount` that is not an integer of USDC base units (`X402_INVALID_MAX_AMOUNT`).
- **A transfer counts only when the USDC arrived.** The receipt is checked with `SessionTxVerifier`. A transfer the wallet refused (not whitelisted, over its cap) comes back SUCCEEDED with nothing moved; that throws `X402_PAYMENT_FAILED` and is never sent to the API.
- **Retries without paying twice.** A paid call the API asks to retry (503 `retryable: true`, 409 in progress) is retried, up to 3 attempts. If it still fails, or the receipt does not arrive (`X402_PAYMENT_PENDING`), the error carries `details.xPayment`; pass it back as `options.xPayment`.
- The session must whitelist `transfer` and cap USDC. `ThinkResponse.x402Payment` is set when the call was paid.
- **`ChipiClient.post({ headers })`** sends extra request headers, such as `X-PAYMENT`. They cannot override `Authorization`, `x-api-key` or `Content-Type`.

### `@chipi-stack/shared`

- **`ChipiApiError.details`**: the API's error body, as returned. Read fields beyond `code` and `message` from it, such as the `x402` offer of a 402 or `availableModels` of a `MODEL_UNAVAILABLE`.

### `@chipi-stack/types`

- `ThinkOptions`, `ThinkSessionPayment`, `ThinkX402Payment`, and `ThinkResponse.x402Payment`.

### Docs

- **A refused session call reports success.** Through Chipi's paymaster, a session call the wallet refuses (over its cap, not whitelisted, revoked session) comes back SUCCEEDED with no `Transfer` event. Check the receipt's events, not `success` alone. Tutorial 04's tick now does.
- **`MODEL_UNAVAILABLE` (503).** When a model's provider is down or out of credit, the API answers 503 with `retryable: false`, `retryAfterSeconds` and `availableModels`, and `/v1/ai/models` reports `available` per model.

### Verification

Unit tests cover the paid path: offer checks, refused and pending transfers, canonical `X-PAYMENT` felts and retries. `MODEL_UNAVAILABLE` was checked live on 2026-10-04. A live paid call has not been run yet: it needs an org without AI credits, so the API returns the 402 offer.

## v14.14.0 (2026-09-29)

Agents on passkey wallets. A server-side agent can now spend from a user's self-custodial SHHH wallet inside on-chain caps, hired with one passkey prompt and stopped with another. Everything is additive: no default changes, and 14.13.x code keeps working unchanged.

Walkthrough: [tutorial 04](./tutorials/04-agent-session-passkey) and the [Agent with a session key and a passkey](https://docs.chipipay.com/sdk/guides/agent-sessions) guide.

### `@chipi-stack/chipi-react` (and `nextjs`, `chipi-expo`)

- **`useChipiSession` supports SHHH wallets.** `supportsSession` is true for SHHH wallets with a STARK or ED25519 signer, which includes every SHHH wallet the SDK creates with a passkey. `useChipiWallet().wallet.supportsSessionKeys` uses the same rule, exported as `walletSupportsSessions(wallet)`.
- **`getEncryptKey` for passkeys.** Pass `getEncryptKey: () => getWalletEncryptKey(credentialId)` instead of a PIN. It runs only when an action needs the owner key, and **before** `getBearerToken`, so the JWT is fetched after the biometric prompt and has not gone stale on the Face ID sheet. `encryptKey` becomes optional; when it is set it wins, as before.
- **Register a session created elsewhere.** `registerSession({ sessionPublicKey, validUntil, ... })` registers a key your server generated, without `createSession`. The session private key never reaches the browser.
- **Session and caps in one signature.** `registerSession({ ..., spendingPolicies })` registers the session and one spending policy per token in a single owner-signed transaction, so the session never exists on-chain without its limits.
- **`revokeSession(sessionPublicKey?)`** revokes a key created elsewhere. `onClick={revokeSession}` still compiles and revokes the current session: the click event is accepted and ignored.
- **The session state catches up by itself after `registerSession`.** The registration hash comes back before the transaction is in a block, so the first read can still see a zeroed struct. The hook now polls every 3 s, for up to 2 minutes, until the session shows up.
- With `getEncryptKey`, **every** action resolves the key, so a browser-side `executeWithSession` prompts too. Keep an agent's session on your server for prompt-free execution.
- **`<Recover />` accepts `labels`** to replace its developer-English copy (`DEFAULT_RECOVER_LABELS` is exported). Unset labels keep today's text.

### `@chipi-stack/backend`

- **`sdk.sessions.setupSession(params, bearerToken)`**: the server-side version of the one-signature setup. Every call is validated before anything is signed; an invalid policy throws `INVALID_SPENDING_POLICY` and nothing is sent.
- **Pure call builders** for owner-signed session management, to batch with other calls or sign with your own owner path: `buildAddSessionKeyCall`, `buildSetSpendingPolicyCall`, `buildRemoveSpendingPolicyCall`, `buildRevokeSessionKeyCall`, `buildSessionSetupCalls`, plus `normalizeEntrypoints` and `validateSpendingPolicyConfig`.
- **`sdk.ai`**: `prices`, `signals`, `think`, `execute`, `chat` and `models` for `/v1/ai/*`, typed from the API's responses. Server-only: it authenticates with the SDK's `sk_` and throws `ChipiAuthError` without one, so a public key in a browser bundle can never spend your AI credits through it.
- **`isThinkDecision(decision)`**: `/v1/ai/think` can return `{ raw }` when the model does not answer in JSON, and nothing stopped a caller from acting on an unexpected `action`. This guard accepts only `swap | supply | withdraw | hold` with the right field types. It checks shape, not judgement: the amounts are still yours to cap.
- **`SessionTxVerifier`** (opt-in; take `from` from the caller's authenticated identity, since hashes are public): when a client pays by sending the transfer itself and hands you the hash, a hash is not proof of payment. The verifier accepts it only if the transaction succeeded, a `Transfer` event from the token moved at least `minAmount` from the payer to you, and the hash was never accepted before (`TxHashStore`, in memory by default; back it with a unique index in production). A failed check never consumes the hash. `X402Facilitator` is unchanged.

### `@chipi-stack/nextjs`

Re-exports what Next.js apps previously had to import from `@chipi-stack/chipi-react` directly: `useGuardianRecovery`, `useThresholdSign`, `useShhhSigner`, `useMigrateWalletToShhh`, `useX402Payment`, `<Recover />`, `DEFAULT_RECOVER_LABELS`, `walletSupportsSessions`, and `PrfUnsupportedError` as a class, so `err instanceof PrfUnsupportedError` works.

### `@chipi-stack/chipi-expo`

Re-exports `useGuardianRecovery`, `useX402Payment` and `walletSupportsSessions`. `<Recover />` renders DOM elements and `PrfUnsupportedError` belongs to browser WebAuthn, so neither is exported from Expo.

### Docs

- The `/v1/ai/think` pages listed the decision as `hold`, `buy` or `sell`. The API returns `swap`, `supply`, `withdraw` or `hold`; code that branched on `"buy"` never ran.
- `getSessionData` reads the latest accepted block. Right after a register, execute or revoke, wait with `waitForTransaction(txHash)` first: until the block is accepted on L2 the read returns the previous state.
- `useSyncOnChainTransfers`: the backend now reads Starknet `Transfer` events (USDC, USDT, ETH, STRK) instead of Voyager.

### Verification

Mainnet smoke against staging chipi-back, on a fresh SHHH V8.4 wallet ([run](https://github.com/chipi-pay/sdks/actions/runs/36627421432)): `setupSession` registered the session and a USDC policy (1 USDC per call, 5 per day) in one transaction; `getSessionData` read it active with 100 calls; a session-signed `USDC.transfer(self, 0)` left 99; `revokeSessionKey` zeroed it.

## v14.13.1 (2026-09-29)

Sessions were unusable in 14.13.0 and earlier: a session registered correctly on-chain, then read back as inactive, and a whitelist written with function names allowed nothing. This patch fixes both without changing any type or field name.

### `@chipi-stack/backend` and `@chipi-stack/types`

- **`getSessionData` reads the real on-chain layout.** `get_session_data` returns the stored `SessionData` struct, `[valid_until, max_calls, calls_used, allowed_entrypoints_len]`, the same on CHIPI v29, v33 and SHHH V8.4. The SDK decoded it as `[is_active, valid_until, remaining_calls, …]`, so `isActive` was effectively always `false`, `validUntil` held `max_calls` and `remainingCalls` held `calls_used`. Now:
  - `isActive` mirrors the contract's own check: registered, not expired, calls left;
  - `remainingCalls` is `max_calls - calls_used`, so a fresh session with `maxCalls: 100` reads `100`, and `99` after one execution;
  - `validUntil` is `0` for a session that was never registered **or** was revoked (the contract zeroes both);
  - `allowedEntrypoints` is always `[]`. The struct carries the whitelist length, never the selectors, so an empty array here does **not** mean "all allowed".
- **`allowedEntrypoints` accepts function names.** Entries went to `add_or_update_session_key` unchanged. On CHIPI wallets `"transfer"` was encoded as a short string: registration succeeded and every later session call failed the whitelist. On SHHH wallets serialising the name threw. Names are now converted to selectors before registration; hex selectors and decimal felts pass through; anything else throws `SESSION_ENTRYPOINT_NOT_ALLOWED`.

  The whitelist is **not scoped to a contract**: `"transfer"` allows `transfer` on every token the wallet holds. Pair it with a spending policy.
- SHHH outside executions hash `call.entrypoint` with `hash.getSelector`, so a hex selector passed as an entrypoint is no longer hashed a second time.

### Verification

Mainnet smoke against staging chipi-back, on a fresh SHHH V8.4 wallet ([run](https://github.com/chipi-pay/sdks/actions/runs/36627419707)): a session registered with `["transfer"]` read back active with 100 calls, and 99 after one session-signed `USDC.transfer(self, 0)`.

### `@chipi-stack/chipi-react`

- **`useChipiSession` executes again.** It relied on `isActive`, so every registered session looked revoked and `executeWithSession` refused to run. A zeroed struct now reads as `"created"` (not registered yet, or revoked elsewhere). The hook reports `"revoked"` after its own `revokeSession` succeeds, `"active"` again if the same key is registered afterwards, and `"expired"` once the session is past its own `validUntil`.
- **Passkey errors keep their code.** `useCreateWallet({ usePasskey: true })` and `useMigrateWalletToPasskey` rethrow with the same message prefix as before, and now also carry the original `code` (for example `PRF_UNSUPPORTED` from `@chipi-stack/chipi-passkey` 2.3.0) and the original error as `cause`. Branch on `error.code === "PRF_UNSUPPORTED"` instead of matching the message.

### Python (`chipi-stack` 2.3.3)

Same two session fixes: `get_session_data` decodes the struct, and `allowed_entrypoints` accepts function names (anything else raises `ChipiSessionError`).

### Upgrading

No code changes are required. If you worked around the whitelist bug by passing hex selectors, keep them: they pass through unchanged. If you read `allowedEntrypoints` from `getSessionData`, stop: it was never populated correctly, and now it is documented as always empty.

## v14.12.1 (unreleased)

### `@chipi-stack/shared`

- **Client-side imports are now supported rather than accidental.** `constants/index.ts` read `process.env` at module scope, so importing anything from `shared` (or from `backend`, which re-exports through it) into browser code only worked because bundlers inject a `process.env` shim. Without one, the *import itself* threw before any of our code ran. Those reads are guarded now, and a test fails the build if a bare `process.env` reappears in a browser-bundled module. Server behaviour is byte-identical: a keyless integrator resolves the same endpoint and `STARKNET_RPC_URL` is still honoured.

  This matters most for `waitForTransaction`, which reads a receipt over RPC and needs no secret, so calling it from a browser hook is a legitimate use. Anything needing an `sk_` stays server-only; that split is about the secret, not the runtime.

### Backend API (no package change)

Two additions to `api.chipipay.com` that integrators drive directly:

- **Treasury signer lifecycle via `sk_`.** `invite` / `list` / `revoke` / `mark-added` were dashboard-only, so signer onboarding could not be expressed as an invariant in provisioning code. Enrolling a `GUARDIAN` is the prerequisite for treasury recovery, so this was not merely convenience.
- **Treasury guardian recovery.** A treasury whose owner devices are lost was permanently dead, and so was everything it controlled. Recovery is authorised by a **guardian's signature verified against on-chain state**, never by an API key or a dashboard session: holding `pk_`, `sk_` and a Chipi session is not enough. Chipi signs nothing, holds no key, and is removable from the path, since `finalize_recovery` is permissionless and `initiate_recovery` can be self-relayed.

  Two limits worth knowing before you rely on it: recovery is **additive** (it adds an owner and removes none, so the threshold is unchanged), and the 7-day `cancel_recovery` veto **needs a surviving owner**, which a 1-of-1 treasury does not have. Get to two owners and enrol guardians before a treasury holds anything meaningful.

  Documented at [Multisig Governance](https://docs.chipipay.com/sdk/guides/multisig-governance).

## v14.12.0 (2026-08-13)

Mostly things integrators were building themselves. If you are on 14.11.0 or earlier, this release deletes code rather than adding it.

### `@chipi-stack/backend`

- **`waitForTransaction`** resolves the hash every gasless write returns: did it succeed, and what did it emit. A **revert comes back as a result** (`success: false` plus `revertReason`), never a throw, because a revert is an outcome you branch on. Only a timeout or transport failure throws, since that is the case where retrying is correct. Those are the two ways a hand-rolled polling loop goes wrong in a money flow: a revert read as success double-credits a ledger, a timeout read as failure strands a transfer that later confirms. Events come back raw for you to decode against your own ABI.
- **`sdk.treasury.getPolicy()` / `setPolicy()`** set the risk-tier quorums, so `borrow` can demand more signatures than `repay` without touching the wallet's on-chain threshold. Previously dashboard-only, so an integrator driving governance from their own server could see a quorum applied but never choose it. An omitted tier is unchanged; an explicit `null` clears it. A quorum can only **raise** `requiredApprovals` above the on-chain threshold, which stays the hard floor.

### `@chipi-stack/chipi-react` and `@chipi-stack/types`

- **`credentialId`** on `useCallAnyContract`, `useApprove` and `useTransfer` scopes the WebAuthn prompt to one credential. Needed when a user holds several Chipi credentials on one device (a reset wallet, a per-entity wallet), where the unscoped prompt can resolve to the wrong credential and derive a key for the wrong wallet. Previously this meant bypassing the hooks entirely and supplying a custom `PasskeyAdapter`. Omitting it reproduces today's prompt exactly, and `credentialId` never reaches the API.

### `@chipi-stack/shared`

- **Ordered RPC chain with transport-level failover**, with Starkscan as an opt-in primary. Nothing changes if you do not set `STARKSCAN_API_KEY`: the primary endpoint stays byte-identical and the SDK simply retries the next endpoint instead of failing when one is unreachable. `waitForTransaction` rides this chain, since reading a receipt is idempotent.

### Also in this release

- Treasury **archive now refuses while proposals are still open** rather than silently stranding an already-approved payment. Archiving blocks execute for the whole treasury, including proposals that already reached quorum, so this prevents the worst version of that. Pass `force` to archive anyway.
- Docs corrections: three pages claimed shipped features did not exist, including the multisig components, which cost at least one integrator a hand-built approval UI. `docs:check` now fails CI when a page says a symbol is absent while the packed types export it.

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
