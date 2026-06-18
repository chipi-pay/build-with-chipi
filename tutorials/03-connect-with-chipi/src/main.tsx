import React from "react";
import ReactDOM from "react-dom/client";
import { StarknetConfig, publicProvider } from "@starknet-react/core";
import { mainnet } from "@starknet-react/chains";
import { ChipiConnector } from "@chipi-stack/starknet-connector";
import { App } from "./App";

// Point at a locally-running walletv2 (the hosted wallet / /connect route).
const walletUrl = import.meta.env.VITE_CHIPI_WALLET_URL ?? "http://localhost:3000";

const connectors = [new ChipiConnector({ walletUrl })];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StarknetConfig chains={[mainnet]} provider={publicProvider()} connectors={connectors}>
      <App />
    </StarknetConfig>
  </React.StrictMode>
);
