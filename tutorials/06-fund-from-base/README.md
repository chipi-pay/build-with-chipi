# Tutorial 06: Fund a Chipi wallet from Base

Your users' USDC is on Base, not on Starknet. This app brings it over in one hook call, through Circle's Cross-Chain Transfer Protocol (CCTP V2): USDC is **burned** on Base and **minted** on Starknet by Circle. No bridge token, no exchange, no custodian in between.

1. **Start.** An anonymous account (a random id in a cookie).
2. **Create the wallet.** A Chipi passkey wallet on Starknet.
3. **Pick a Base wallet.** MetaMask, Rabby, Coinbase Wallet… (EIP-6963).
4. **Bring USDC.** Quote both speeds first, then one hook: switch to Base, approve + burn, register with Chipi, mint on Starknet.
5. **Follow it.** From the burn hash, on any device. You can close the page.

Requires `@chipi-stack/nextjs` and `@chipi-stack/backend` **14.18.0** or later. Starknet **mainnet** and Base **mainnet** only.

## What runs where, and who pays

| Step | Where | Signs with | Prompts | Pays |
|------|-------|-----------|---------|------|
| 2. Create the wallet | Browser | passkey (WebAuthn PRF) | 1 passkey | Chipi (deploy is gasless) |
| 3. Connect | Browser | EVM wallet (`eth_requestAccounts`) | 1 EVM | nobody |
| 4a. Switch to Base | Browser | EVM wallet (`wallet_switchEthereumChain`) | 0–1 EVM | nobody |
| 4b. Approve + burn | Browser | EVM wallet | 1 EVM (EIP-5792 batch) or 2 | the user: Base gas, cents |
| 4c. Attestation | Circle | | 0 | **standard**: free · **fast**: Circle's fee, from the amount |
| 4d. Mint on Starknet | Chipi's delivery service | Chipi's manager account | 0 | Chipi |

The passkey's key never leaves the browser. Nothing on the server can move funds: this app's server only issues JWTs. The Chipi wallet is the only possible recipient of the mint, and the SDK checks that before the EVM wallet signs.

## 1. Set up

```bash
cd tutorials/06-fund-from-base
npm install
cp env.example .env.local   # APP_URL, APP_SECRET, APP_JWT_PRIVATE_KEY, NEXT_PUBLIC_CHIPI_API_KEY
npm run dev
```

Two things need a public **https** URL, so in development run the app behind a tunnel (`cloudflared tunnel --url http://localhost:3000`) and set `APP_URL` to it:

- Chipi fetches this app's JWKS from `${APP_URL}/api/auth/jwks`.
- The passkey is bound to the hostname you open the app on.

In the [Chipi dashboard](https://dashboard.chipipay.com/configure/jwks-endpoint), register `${APP_URL}/api/auth/jwks`. The tokens are shaped like Better Auth's JWT plugin (RS256, one key, `iss` and `aud` = `APP_URL`, `sub` = the user id), so pick **Better Auth** as the provider.

You need an EVM wallet with some USDC on Base (native USDC, `0x8335…2913`) and a little ETH on Base for gas (a deposit costs cents).

## 2. The account and the token

[`lib/auth.ts`](./lib/auth.ts) is the smallest auth that works with Chipi: `POST /api/auth/anonymous` puts a random user id in a signed, httpOnly cookie, and `GET /api/auth/token` issues a 15-minute RS256 JWT whose `sub` is that id. Chipi checks it against `/api/auth/jwks`. The SDK's deposit hook asks for a fresh token before every step (`getBearerToken`), so a token can't expire while Circle attests.

**Deliberately minimal.** Lose the cookie and this app can't find the wallet again (Chipi still has it, under that user id). In production use a real auth library so the account survives the browser: Vela does it with Better Auth's anonymous plugin plus passkey sign-in, so the same passkey opens the account on a new device ([`lib/auth.ts` in Vela](https://github.com/chipi-pay/vela/blob/main/lib/auth.ts)).

## 3. Create the Chipi wallet (passkey)

[`app/components/create-passkey-wallet.tsx`](./app/components/create-passkey-wallet.tsx), the same as tutorial 05:

```tsx
await createWalletAsync({
  params: { externalUserId: userId, chain: Chain.STARKNET, walletType: "SHHH", usePasskey: true },
  bearerToken,
});
```

Passkey only, no PIN: the passkey's PRF output encrypts the key, so neither Chipi nor this app can decrypt it. On a device without WebAuthn PRF the hook throws with `code: "PRF_UNSUPPORTED"` instead of creating a wallet the server could decrypt.

## 4. Pick the wallet that holds the USDC

[`app/components/pick-evm-wallet.tsx`](./app/components/pick-evm-wallet.tsx). `discoverEvmWallets()` (from `@chipi-stack/backend`) asks the page for EIP-6963 announcements and lists every wallet that answers, falling back to `window.ethereum`. One click connects:

```ts
const wallets = await discoverEvmWallets(); // [{ info: { name, icon, rdns, uuid }, provider }]
const [account] = (await wallet.provider.request({ method: "eth_requestAccounts" })) as `0x${string}`[];
```

The wallet may be on any chain now; the SDK switches it to Base when the deposit starts. The balance shown comes from a public Base RPC ([`lib/base.ts`](./lib/base.ts)), so it is right whatever chain the wallet is on.

## 5. Bring USDC: quote, then one hook

[`app/components/fund-from-base.tsx`](./app/components/fund-from-base.tsx)

### Quote both speeds first

```ts
const { quote, depositAsync } = useCrossChainDeposit();
const quotes = await quote({ chain: BASE, amount: "25" });
// quotes.standard: feeBps 0, receivesUsdc "25", eta 15–20 minutes
// quotes.fast:     feeBps 1.3, feeUsdc "0.0325", receivesUsdc "24.9675", eta a minute or two
```

`cctpQuote` asks Circle's fee API for this route and uses Circle's attestation times per chain and finality. The two buttons show exactly what came back, and the ETA text comes from `formatCctpEta`: no duration is typed in this app.

- **Standard** waits for Base's hard finality (Circle waits for Ethereum finality: about 15–20 minutes) and is **free**. The user receives the full amount.
- **Fast** attests after a few blocks, in about a minute, for **Circle's fee**, taken from the amount (1.3 bps from Base when this was written: $0.0325 on $25). Shown before signing, paid by the user.

### Then one call

```ts
const result = await depositAsync({
  provider: evm.wallet.provider,
  account: evm.account,
  chain: BASE,
  amount: q.amountUsdc,
  walletAddress: chipiWallet, // the Chipi wallet: the only possible recipient
  finality,                   // "standard" | "fast"
  getBearerToken: getChipiToken,
  onStatus: ({ step, eta, burnTxHash }) => {
    if (burnTxHash) savePendingDeposit(chipiWallet, { burnTxHash, amountUsdc: q.amountUsdc, startedAt: Date.now() });
    setStatus(stepLabel(step, formatCctpEta(eta)));
  },
});
```

What the SDK does, in order (`onStatus` reports each step with how long it usually takes):

1. `switching-chain`: `wallet_switchEthereumChain` to Base, then `eth_chainId` is read back and checked. A wallet that says it switched but didn't is refused.
2. The recipient gate: the Chipi wallet becomes the 32-byte `mintRecipient`, and `assertMintRecipient` decodes it back and compares. **A wrong recipient is the only way to lose a deposit**, so this is checked before anything is signed, in the SDK, where every app gets it.
3. `approving` / `burning`: balance and allowance are read; `approve` and `depositForBurn` go out as one EIP-5792 batch when the wallet supports atomic batches (one prompt), otherwise approve, wait, burn (two prompts). The receipt's `status` must be `0x1`.
4. `registering`: the burn hash is sent to Chipi (`registerCctpDeposit`). From here the deposit completes **even if the page closes**: Chipi's delivery service polls Circle and mints from its own account. The burn sets `destinationCaller = 0`, so the mint is permissionless: if Chipi's service were down for a day, the message would still be mintable later.
5. `attesting`: the long step. Circle signs the message once Base reaches the chosen finality.
6. `minting`: Chipi calls `receive_message` on Starknet's `MessageTransmitterV2`; the USDC appears in the Chipi wallet.
7. `recording`: the deposit is written to the wallet's history with its source chain (best effort).

`depositAsync` resolves with `{ burnTxHash, mintTxHash, quote, startedAt, batched }`. If it rejects with a `CrossChainDepositError`, the burn already happened: the error carries `burnTxHash` and `sourceDomain`, and step 5 of the app follows it.

## 6. Follow it, from any device

[`app/components/deposit-progress.tsx`](./app/components/deposit-progress.tsx). The burn hash is kept per Chipi wallet in `localStorage` ([`lib/deposit-store.ts`](./lib/deposit-store.ts)) the moment it exists, and followed with:

```ts
const { data } = useCctpDepositStatus({ burnTxHash, getBearerToken: getChipiToken });
// data.status: "PENDING" | "MINTED" (data.mintTx) | "FAILED" | "UNREGISTERED"
```

It polls chipi-back every 15 seconds while `PENDING` and stops on anything else. Reload, close the tab, come back after lunch: the hash is all it needs. In production keep the hash on your server too; `localStorage` is one browser.

## 7. Going to production

- **The recipient.** Never let a user type the Starknet recipient. It is their Chipi wallet; the SDK checks the encoding. If you build your own flow with `depositFromEvm`, keep `assertMintRecipient` in it.
- **Show both prices.** `quote` costs one request to Circle. A user who sees "free in 15 to 20 minutes" next to "a minute for $0.03" makes their own choice; a spinner with no time is what people complain about.
- **Register early, store the hash.** Call nothing between the burn and `registerCctpDeposit` (the hook already does this). Keep the burn hash with the user's record on your server, not only in the browser.
- **Base first.** `CCTP_EVM_CHAINS` lists Arbitrum, Optimism, Polygon and Ethereum too, wired the same way, but Chipi has run real transfers only on Base (`verified: true`). Offer another chain after a $1 canary. Ethereum deposits cost mainnet gas.
- **Expired attestations.** A fast attestation expires about 24 hours after signing. If a mint is attempted later it reverts; Chipi asks Circle to re-attest and mints again. Nothing is lost by waiting, so don't surface it as a failure.
- **Real auth.** Replace [`lib/auth.ts`](./lib/auth.ts) with sessions in a database and passkey sign-in, so the account outlives the cookie.
- **Withdrawals.** The reverse direction is `useCrossChainWithdraw` (Starknet → Base, always fast, Chipi's relayer delivers and pays Circle's fee back under its sponsorship policy). Not in this tutorial; see the guide below.

## Related docs

- [Cross-chain USDC](https://docs.chipipay.com/sdk/guides/cross-chain-usdc)
- [useCrossChainDeposit](https://docs.chipipay.com/sdk/nextjs/hooks/use-cross-chain-deposit), [useCctpDepositStatus](https://docs.chipipay.com/sdk/nextjs/hooks/use-cctp-deposit-status), [useCrossChainWithdraw](https://docs.chipipay.com/sdk/nextjs/hooks/use-cross-chain-withdraw)
- [v14.18.0 release notes](https://docs.chipipay.com/sdk/releases/v14-18-0)
- Circle: [CCTP V2 technical guide](https://developers.circle.com/cctp/references/technical-guide), [required block confirmations](https://developers.circle.com/cctp/required-block-confirmations)
- The same flow inside a full app: Vela, [course module 20](https://github.com/chipi-pay/vela/blob/main/course/20-fund-from-any-chain.md)
