// Every limit the agent runs under, in one place. The same numbers are
// enforced twice: on-chain by the spending policies (the wallet contract
// refuses anything above them) and here, before the agent asks for a swap.

export const TOKENS = {
  USDC: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
} as const;

/** How long the agent is hired for. */
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

/** Session-signed transactions allowed in that time. */
export const MAX_CALLS = 200;

/**
 * Functions the session may call. The whitelist is not scoped to a contract,
 * so `transfer` and `approve` are allowed on every token: the policies below
 * cap each one. `multi_route_swap` is AVNU's swap entrypoint.
 */
export const ALLOWED_ENTRYPOINTS = ["approve", "transfer", "multi_route_swap"];

const DAY = 86_400;

/**
 * One cap per token the wallet may hold. `maxPerWindow` must be positive:
 * 0 means "no cap" on-chain.
 */
export const SPENDING_POLICIES = [
  { token: TOKENS.USDC, maxPerCall: 5_000_000n, maxPerWindow: 20_000_000n, windowSeconds: DAY }, // 5 / 20 USDC
  { token: TOKENS.ETH, maxPerCall: 2_000_000_000_000_000n, maxPerWindow: 8_000_000_000_000_000n, windowSeconds: DAY }, // 0.002 / 0.008 ETH
  { token: TOKENS.STRK, maxPerCall: 50n * 10n ** 18n, maxPerWindow: 200n * 10n ** 18n, windowSeconds: DAY }, // 50 / 200 STRK
];

/** The largest single swap the agent may request, in USD. Below the USDC per-call cap. */
export const MAX_TRADE_USD = 5;

/**
 * The most the agent pays for one AI decision over x402, in USDC base units
 * ($0.02). Chipi asks for payment only when your org has no AI credits; the
 * payment is a session `transfer`, so the USDC policy above caps it too.
 */
export const MAX_AI_PRICE_USDC = 20_000n;

/** Tokens the agent is allowed to trade. Anything else the model suggests is ignored. */
export const TRADABLE = new Set(["USDC", "ETH", "STRK"]);
