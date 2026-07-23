import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// Tutorial harness for "Connect with Chipi" (`VITE_CHIPI_WALLET_URL`, default
// https://wallet.chipipay.com) alongside other real connectors. wasm() +
// topLevelAwait() are required for @cartridge/connector's Rust-compiled
// account/session bindings (@cartridge/controller-wasm), without them Vite's
// dev transform fails on "ESM integration proposal for Wasm is not supported".
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: { port: 5500 },
});
