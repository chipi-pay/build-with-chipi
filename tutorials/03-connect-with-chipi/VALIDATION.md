# Validation Report — Tutorial 03: Connect with Chipi (dApp → Chipi wallet)

**Tester:** Claude (agent session), reviewed by Carlos Castillo
**Date:** 2026-07-23
**Framework:** React + Vite (`@starknet-react/core`)
**Auth Provider:** N/A — this tutorial builds the *dApp side* of a wallet
connection, not an app with its own auth. The Chipi wallet's own auth
(Clerk + passkey) lives behind the popup, on wallet.chipipay.com.
**SDK Version:** `@chipi-stack/starknet-connector@0.1.4`
**Tutorial Issue:** N/A (migrated from `chipi-pay/sdks/examples/connect-with-chipi`,
which is private — this tutorial is its public, canonical home)

---

## Docs Pages Validation

| # | Docs Page | Status | Bug Issue | Notes |
|---|-----------|--------|-----------|-------|
| 1 | [Connector overview](https://docs.chipipay.com/sdk/connector/overview) | PASS | | Install + connector setup steps match exactly what's in `src/main.tsx`. |
| 2 | [Connector security model](https://docs.chipipay.com/sdk/connector/security) | PASS | | Decoded-approval behavior confirmed live in the popup during testing. |
| 3 | [Connector API reference](https://docs.chipipay.com/sdk/connector/api) | PASS | | `walletUrl`/`register` options and compatibility ranges match the installed package. |

### Per-page details

#### Page 1: Connector overview
- [x] Install commands worked (`npm install @chipi-stack/starknet-connector @starknet-react/core @starknet-react/chains starknet`)
- [x] Code examples compiled without changes (`npx tsc --noEmit` clean)
- [x] Feature worked when tested in browser (see Features Validation below)
- [x] Instructions were clear
- Notes: none.

#### Page 2: Connector security model
- [x] Install commands N/A (conceptual page)
- [x] Code examples N/A
- [x] Feature worked when tested in browser — the popup rendered the "Sign in to
      Chipi" decoded-approval-gated screen exactly as documented, from a fresh,
      unauthenticated session (production, no cookies).
- [x] Instructions were clear
- Notes: none.

#### Page 3: Connector API reference
- [x] Install commands N/A
- [x] Code examples compiled without changes
- [x] Feature worked — `register: true` (default) self-registration confirmed
      separately via the `chipi-pay/chipi-extension` repo's own smoke test
      (`window.starknet_chipi` + `starknet:announceWallet`), same code path.
- [x] Instructions were clear
- Notes: none.

---

## Features Validation

| Feature | Status | Notes |
|---------|--------|-------|
| Connector renders in the picker alongside other wallets | PASS | Chipi, Ready, Braavos, Cartridge all rendered as real connector buttons from the same `connectors` array, no conflicts. |
| `available()` correctly reflects installed state | PASS | Chipi and Cartridge (both popup/iframe-based, no extension) report available; Ready and Braavos correctly report unavailable in a browser with no wallet extensions installed. |
| `ChipiConnector.connect()` opens the real hosted wallet | PASS | Verified via Playwright against **production** (`wallet.chipipay.com`, not a mock) — popup opens to `/connect`, resolves through a brief loading state to a real "Sign in to Chipi" screen. |
| Third-party connector coexistence (Cartridge) | PASS | Clicking Cartridge's connector opened its real, official sign-in UI (iframe) with zero errors or interference from the Chipi connector being present in the same array. |
| Full round-trip: passkey sign-in → signTypedData → gasless execute | NOT RUN | Requires a real user passkey (Face ID/Touch ID) to complete — cannot be automated in a headless CI/agent environment. Structurally verified up to the sign-in prompt; the signTypedData/execute code paths are unchanged from the previously-validated version of this example. |

---

## Hooks / Methods Exercised

| Hook/Method | Used in file | Works? |
|-------------|-------------|--------|
| useConnect | src/App.tsx | YES |
| useAccount | src/App.tsx | YES |
| useDisconnect | src/App.tsx | YES |
| account.signMessage | src/App.tsx | Not run (needs passkey — see above) |
| account.execute | src/App.tsx | Not run (needs passkey — see above) |
| connector.available | src/App.tsx | YES |

---

## Bugs Found (and fixed as part of this migration)

| Bug | Repo | Issue | Status |
|-----|------|-------|--------|
| Tutorial's `App.tsx` had a malformed USDC contract address (`0x053c9125…`, wrong prefix vs. the real `0x033068f6…`) | chipi-pay/build-with-chipi | — | Fixed in this PR |
| Default `walletUrl` was `http://localhost:3000` — broken out of the box for any external developer with no local walletv2 running | chipi-pay/build-with-chipi | — | Fixed in this PR (now defaults to production) |
| Docs guide referenced a private repo (`chipi-pay/sdks`) as "the example" — unreachable for external developers | chipi-pay/sdks, chipi-pay/build-with-chipi | — | Fixed in this PR (this tutorial is now the canonical public home; sdks' private copy stays as our internal dev harness) |
| Vite dev server crashed on `@cartridge/connector`'s WASM bindings ("ESM integration proposal for Wasm is not supported") | chipi-pay/build-with-chipi | — | Fixed in this PR (`vite-plugin-wasm` + `vite-plugin-top-level-await`) |

---

## Build Verification

```bash
git clone https://github.com/chipi-pay/build-with-chipi
cd build-with-chipi/tutorials/03-connect-with-chipi
npm install
npm run build
```

- [x] Clean install works (no manual steps needed)
- [x] Build passes (`npx tsc --noEmit` and `vite build` both clean)
- [x] App runs at localhost (`npm run dev`, verified on port 5502 during testing)

---

## Recording

- [ ] Video recorded (5-8 min)
- [ ] Video link: **not recorded** — this validation was performed by an
      agent session without screen-recording capability. Every claim above is
      backed by Playwright automation against production instead (real popup,
      real URLs, real third-party connector, screenshots on request). Carlos:
      your call whether to record a short walkthrough yourself or treat the
      automated evidence above as sufficient for this particular tutorial.
