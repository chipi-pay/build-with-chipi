import React from "react";
import ReactDOM from "react-dom/client";
import { InjectedConnector, StarknetConfig, publicProvider, ready, braavos } from "@starknet-react/core";
import { mainnet } from "@starknet-react/chains";
import { chipi } from "@chipi-stack/starknet-connector";
import { ControllerConnector } from "@cartridge/connector";
import { App } from "./App";

// Defaults to the production Chipi wallet: this is a public tutorial, and an
// external developer running `npm run dev` has no local walletv2 to point at.
// Set VITE_CHIPI_WALLET_URL=http://localhost:3000 only for our own internal
// testing against a locally-running walletv2.
const walletUrl = import.meta.env.VITE_CHIPI_WALLET_URL ?? "https://wallet.chipipay.com";

// Chipi sits alongside every other standard connector with zero special
// treatment: same array, same interface, no whitelisting on either side.
// ready()/braavos() are extension-based (@starknet-react/core's built-in
// factories, auto-detect via window.starknet_*); Cartridge is iframe/popup-
// based like Chipi itself, proof a hosted-wallet-in-popup connector is
// already an accepted "standard" shape on Starknet, not just an extension one.
//
// Bramble is an extension that injects window.starknet_bramble. starknet-react
// has no bramble() factory, and injected({ id }) takes no name, so the
// connector is built from the exported class: the name shows in the picker
// even before Bramble is installed. It reads window.starknet_bramble on every
// call, so a provider that injects after page load is still found.
const connectors = [
  chipi({ walletUrl, name: "Chipi" }),
  new InjectedConnector({ options: { id: "bramble", name: "Bramble" } }),
  ready(),
  braavos(),
  new ControllerConnector(),
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StarknetConfig chains={[mainnet]} provider={publicProvider()} connectors={connectors}>
      <App />
    </StarknetConfig>
  </React.StrictMode>
);
