# Tutorial 03: Connect with Chipi (dApp to Chipi wallet)

Build a Starknet dApp that lets users **connect with their Chipi wallet**, a
passkey smart-account that signs **gasless** through the paymaster. No browser
extension, no WalletConnect, and **no whitelisting or approval process on our
side**: any Starknet dApp can add it directly, packaged as a one-line
[starknet-react](https://starknet-react.com) connector.

> The previous tutorials build a *wallet*. This one builds a *dApp that connects
> to* Chipi wallets, the other side of the table.

## What you'll build

A dApp that:

1. offers **"Connect with Chipi"** in its connect flow, **alongside your other
   connectors**, this tutorial wires up other real connectors in the same
   array, so there's no special treatment or coordination required on either
   side,
2. signs a SNIP-12 typed message with the user's Chipi passkey,
3. runs a **gasless** transaction (an ERC-20 `approve`) and gets a tx hash back.

All through the standard `@starknet-react/core` interface: your dApp doesn't
need to know anything about passkeys or paymasters.

## 1. Install

```bash
npm install @chipi-stack/starknet-connector@^0.5.0 @starknet-react/core @starknet-react/chains starknet
```

Use `^0.5.0`: on a `0.x` version a caret never crosses a minor, so `^0.4.0`
stays on 0.4 and doesn't get the fix that lets Chipi sit next to Bramble
(see [Chipi next to Bramble](#chipi-next-to-bramble)).

## 2. Add the connector, next to whatever else you already use

The entire integration is one connector in your `StarknetConfig`
([`src/main.tsx`](./src/main.tsx)). It's just another entry in the array:

```tsx
import { InjectedConnector, StarknetConfig, publicProvider, ready, braavos } from "@starknet-react/core";
import { mainnet } from "@starknet-react/chains";
import { chipi } from "@chipi-stack/starknet-connector";

const connectors = [
  chipi(), // "Connect with Chipi"
  new InjectedConnector({ options: { id: "bramble", name: "Bramble" } }),
  ready(),
  braavos(),
  // ...any other connector your dApp already ships
];

<StarknetConfig chains={[mainnet]} provider={publicProvider()} connectors={connectors}>
  <App />
</StarknetConfig>;
```

This tutorial's own [`src/main.tsx`](./src/main.tsx) goes one further and adds
[`@cartridge/connector`](https://docs.cartridge.gg) too, an independent, hosted
popup/iframe-based wallet (no browser extension) live-tested side by side with
Chipi with zero conflicts, same shape as Chipi. If you're wondering whether
that model is "standard" on Starknet, this is the proof: it already is.

starknet-react has no `bramble()` factory, and `injected({ id })` takes no
name, so Bramble is built from the exported `InjectedConnector` class: its name
then shows in the picker even before Bramble is installed. List Bramble and
Chipi explicitly: starknet-react's `useInjectedConnectors` discovers neither.

## 3. Use it like any wallet

Inside the app ([`src/App.tsx`](./src/App.tsx)) it's plain starknet-react:

```tsx
const { connect, connectors } = useConnect();
const { account, address } = useAccount();

// connect
connect({ connector: connectors[0] });

// sign typed data (SNIP-12)
const sig = await account.signMessage(typedData);

// gasless execute
const { transaction_hash } = await account.execute([
  { contractAddress: USDC, entrypoint: "approve", calldata: [spender, "0x0", "0x0"] },
]);
```

The example UI checks `connector.available()` for every connector and greys out
whichever wallets aren't installed in the current browser: an honest picker,
not a fake "supported wallets" list.

## Chipi next to Bramble

Bramble is a browser-extension wallet that injects
`window.starknet_bramble`. Chipi registers `window.starknet_chipi`. Wallet
scanners (get-starknet v4 `getAuthorizedWallets` / `getLastConnectedWallet`)
call passive methods on **every** `window.starknet*` object at page load, Chipi's
included. Up to 0.4 those calls tried to open the Chipi popup outside a click.
From **0.5.0**, until the user connects, Chipi answers them itself, without a
popup:

| Call | Chipi's answer before connect |
|------|-------------------------------|
| `wallet_getPermissions` | `[]` |
| `wallet_requestAccounts` with `silent_mode: true` | `[]` |
| `wallet_requestChainId` | `SN_MAIN` |

So both wallets coexist in one picker and one scan. Bramble has its own rules,
and this tutorial follows them:

- **The provider can arrive late.** `window.starknet_bramble` may be missing at
  page load. The connector reads it on every call, and [`src/App.tsx`](./src/App.tsx)
  re-renders on `starknet#initialized` so "Detected" is up to date.
- **Prompts need a click.** Connect, sign and execute all start from a button.
  A prompt stays pending until the user decides; don't auto-retry (Bramble
  allows 5 pending prompts per site).
- **113 and 163.** `113` means the user declined (or the prompt expired after 5
  minutes). `163` covers a locked wallet, a site that isn't connected, and
  policy refusals. The example log says which, and the user retries by hand.
- **Typed data names the chain.** The SNIP-12 domain must carry a `chainId`
  equal to Bramble's active network (`SN_MAIN` here), or Bramble answers `114`
  before any prompt. The example's typed data does.
- **Invoke takes `calls` only.** Bramble estimates the fee itself and refuses a
  fee, `max_fee` or paymaster key (`114`). starknet.js `WalletAccount.execute`
  sends exactly `{ calls }`. Bramble pays its own fee in STRK: there is no
  dApp paymaster through its public provider.
- **Lowercase addresses** in calldata.
- **One account per site.** If the user switches to an account the site wasn't
  approved for, Bramble emits `accountsChanged([])`: starknet-react shows it as
  a disconnect. `wallet_disconnect` isn't supported; users disconnect sites
  inside Bramble.

To go further with Bramble (sign in, fund a Chipi wallet, make Bramble a
co-owner), see [tutorial 05](../05-bramble-trusted-wallet).

## How it works

```
your dApp                          Chipi hosted wallet (wallet.chipipay.com)
─────────                          ──────────────────────────────────────────
ChipiConnector.connect()
  ├─ opens a popup ──────────────►  /connect  (the user's authenticated wallet)
  └─ postMessage  ◄────────────►    decoded approval (passkey + gasless paymaster)
account.execute(calls)
  └─ wallet_addInvokeTransaction ─►  user approves ─► sponsored tx ─► tx hash
```

The connector is **transport only**: it opens the hosted wallet in a popup and
forwards get-starknet `wallet_*` calls over `postMessage`. It holds no keys. The
hosted wallet renders a **decoded approval** for every action (it shows the real
intent, token, amount, spender, and hard-blocks typed data it can't read) and
runs the real passkey + paymaster path.

## Run it

```bash
npm install
npm run dev   # → http://localhost:5500
```

By default it connects to the production Chipi wallet. To point at a local Chipi
wallet during development, set `VITE_CHIPI_WALLET_URL`:

```bash
VITE_CHIPI_WALLET_URL=http://localhost:3000 npm run dev
```

Then: **Connect with Chipi** → approve in the popup → **signTypedData** (Face ID
→ signature) → **execute** (gasless tx hash in the log). With Bramble installed,
pick **Bramble** instead: the same buttons go to Bramble's panel, and execute
costs a little STRK.

`vite-plugin-wasm` + `vite-plugin-top-level-await` are wired into
[`vite.config.ts`](./vite.config.ts), required for `@cartridge/connector`'s
Rust-compiled account bindings; without them Vite's dev server fails on "ESM
integration proposal for Wasm is not supported."

## Notes

- Starknet **mainnet**, gasless via the paymaster.
- Works alongside any other connector: this tutorial ships Bramble, `ready()`,
  `braavos()`, and a third hosted-wallet connector as real, working examples,
  not placeholders.
- `get-starknet-core` stays in `package.json`: it is a peer dependency of
  `@starknet-react/core` 5.

Full reference: [docs.chipipay.com → Connector](https://docs.chipipay.com/sdk/connector/overview).
