// Addresses and limits, in one place. No SDK imports: the browser and the
// server both read this file.

/** Starknet mainnet, as `wallet_requestChainId` answers it. This tutorial never uses a testnet. */
export const MAINNET_CHAIN_ID = "0x534e5f4d41494e"; // "SN_MAIN"

export const RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet";

export const TOKENS = {
  /** Native USDC (not the bridged USDC.e). */
  USDC: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  /** Bramble pays its own network fees in STRK. */
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
} as const;

export const USDC_DECIMALS = 6;

/** Below this, Bramble likely can't pay the fee (a new account's first transaction also deploys it). */
export const MIN_STRK_FOR_FEES = 10n ** 17n; // 0.1 STRK

/** How Bramble is recorded in the Chipi wallet's owner set. */
export const BRAMBLE_LABEL = "bramble";

// The agent session Bramble approves in step 6.

/** How long the session lives. */
export const SESSION_SECONDS = 24 * 60 * 60;

/** Session-signed transactions allowed in that time. */
export const MAX_CALLS = 50;

/**
 * Functions the session may call. The whitelist is not scoped to a contract:
 * `transfer` is allowed on every token, so every token gets a cap below.
 */
export const ALLOWED_ENTRYPOINTS = ["transfer"];

const DAY = 86_400;

/** One cap per token the wallet may hold. `maxPerWindow` is never 0: 0 means "no cap" on-chain. */
export const SPENDING_POLICIES = [
  { token: TOKENS.USDC, maxPerCall: 1_000_000n, maxPerWindow: 5_000_000n, windowSeconds: DAY }, // 1 / 5 USDC
  { token: TOKENS.ETH, maxPerCall: 500_000_000_000_000n, maxPerWindow: 2_000_000_000_000_000n, windowSeconds: DAY }, // 0.0005 / 0.002 ETH
  { token: TOKENS.STRK, maxPerCall: 10n * 10n ** 18n, maxPerWindow: 50n * 10n ** 18n, windowSeconds: DAY }, // 10 / 50 STRK
];

/** 0x + 64 lowercase hex: the form Bramble accepts and the SDK compares. */
export function normalizeAddress(address: string): string {
  return `0x${BigInt(address).toString(16).padStart(64, "0")}`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** "12.5" → 12_500_000n. Returns null for anything that isn't a positive amount with at most 6 decimals. */
export function parseUsdc(input: string): bigint | null {
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
