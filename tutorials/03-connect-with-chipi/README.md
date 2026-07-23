# Tutorial 03 — Connect with Chipi (dApp → Chipi wallet)

Build a Starknet dApp that lets users **connect with their Chipi wallet** — a
passkey smart-account that signs **gasless** through the paymaster. No browser
extension, no WalletConnect, and **no whitelisting or approval process on our
side** — any Starknet dApp can add it directly, packaged as a one-line
[starknet-react](https://starknet-react.com) connector.

> The previous tutorials build a *wallet*. This one builds a *dApp that connects
> to* Chipi wallets — the other side of the table.

## What you'll build

A dApp that:

1. offers **"Connect with Chipi"** in its connect flow, **alongside your other
   connectors** — this tutorial wires up real ones (Ready, Braavos, Cartridge)
   in the same array, to prove there's no special treatment or coordination
   required on either side,
2. signs a SNIP-12 typed message with the user's Chipi passkey,
3. runs a **gasless** transaction (an ERC-20 `approve`) and gets a tx hash back.

All through the standard `@starknet-react/core` interface — your dApp doesn't
need to know anything about passkeys or paymasters.

## 1. Install

```bash
npm install @chipi-stack/starknet-connector @starknet-react/core @starknet-react/chains starknet
```

## 2. Add the connector — next to whatever else you already use

The entire integration is one connector in your `StarknetConfig`
([`src/main.tsx`](./src/main.tsx)). It's just another entry in the array:

```tsx
import { StarknetConfig, publicProvider, ready, braavos } from "@starknet-react/core";
import { mainnet } from "@starknet-react/chains";
import { ChipiConnector } from "@chipi-stack/starknet-connector";

const connectors = [
  new ChipiConnector(), // "Connect with Chipi"
  ready(),
  braavos(),
  // ...any other connector your dApp already ships
];

<StarknetConfig chains={[mainnet]} provider={publicProvider()} connectors={connectors}>
  <App />
</StarknetConfig>;
```

This tutorial's own [`src/main.tsx`](./src/main.tsx) goes one further and adds
[`@cartridge/connector`](https://docs.cartridge.gg) too — a fourth, independent
wallet, live-tested side by side with Chipi with zero conflicts. Cartridge is
also a hosted, popup/iframe-based wallet (no browser extension), same shape as
Chipi — if you're wondering whether that model is "standard" on Starknet, this
is the proof: it already is.

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
whichever wallets aren't installed in the current browser — an honest picker,
not a fake "supported wallets" list.

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

The connector is **transport only** — it opens the hosted wallet in a popup and
forwards get-starknet `wallet_*` calls over `postMessage`. It holds no keys. The
hosted wallet renders a **decoded approval** for every action (it shows the real
intent — token, amount, spender — and hard-blocks typed data it can't read) and
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
→ signature) → **execute** (gasless tx hash in the log).

`vite-plugin-wasm` + `vite-plugin-top-level-await` are wired into
[`vite.config.ts`](./vite.config.ts) — required for `@cartridge/connector`'s
Rust-compiled account bindings; without them Vite's dev server fails on "ESM
integration proposal for Wasm is not supported."

## Notes

- Starknet **mainnet**, gasless via the paymaster.
- Works alongside any other connector — this tutorial ships `ready()`,
  `braavos()`, and Cartridge as real, working examples, not placeholders.

Full reference: [docs.chipipay.com → Connector](https://docs.chipipay.com/sdk/connector/overview).
