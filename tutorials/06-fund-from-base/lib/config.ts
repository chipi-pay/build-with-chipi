// Addresses and limits, in one place. No SDK imports: the browser and the
// server both read this file.

export const RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet";

/** Reads the user's USDC balance on Base before they deposit. */
export const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";

/** Native USDC on Starknet (not the bridged USDC.e). This is what Circle mints. */
export const STARKNET_USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";

export const USDC_DECIMALS = 6;

/** The one chain this tutorial deposits from: the SDK marks it `verified` (Chipi has run real transfers on it). */
export const SOURCE_CHAIN_KEY = "base";

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** "12.5" → 12_500_000n. Returns null for anything that isn't a positive amount with at most 6 decimals. */
export function parseUsdcInput(input: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(input.trim());
  if (!match) return null;
  const units = BigInt(match[1]) * 10n ** BigInt(USDC_DECIMALS) + BigInt((match[2] ?? "").padEnd(USDC_DECIMALS, "0"));
  return units > 0n ? units : null;
}

export function formatUnits(units: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const fraction = (units % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${units / base}.${fraction}` : `${units / base}`;
}
