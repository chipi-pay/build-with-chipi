import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal harness to test "Connect with Chipi" against a locally-running
// walletv2 (`VITE_CHIPI_WALLET_URL`, default http://localhost:3000).
export default defineConfig({
  plugins: [react()],
  server: { port: 5500 },
});
