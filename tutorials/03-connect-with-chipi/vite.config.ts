import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// Minimal harness to test "Connect with Chipi" against a locally-running
// walletv2 (`VITE_CHIPI_WALLET_URL`, default http://localhost:3000) alongside
// other real connectors (Ready/Braavos/Cartridge). wasm() + topLevelAwait()
// are required for @cartridge/connector's Rust-compiled account/session
// bindings (@cartridge/controller-wasm) — without them Vite's dev transform
// fails on "ESM integration proposal for Wasm is not supported".
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: { port: 5500 },
});
