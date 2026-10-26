import { cctpEvmChainByKey, encodeEvmBalanceOf } from "@chipi-stack/backend";
import { BASE_RPC_URL, SOURCE_CHAIN_KEY } from "./config";

/** Base, as the SDK describes it: chain id 8453, Circle domain 6, native USDC, Basescan. */
export const BASE = cctpEvmChainByKey(SOURCE_CHAIN_KEY)!;

/**
 * The account's USDC on Base, read from a public RPC rather than through the
 * wallet: the wallet may be on another chain until the SDK switches it.
 */
export async function baseUsdcBalance(account: string): Promise<bigint> {
  const res = await fetch(BASE_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: BASE.usdc, data: encodeEvmBalanceOf(account) }, "latest"],
    }),
  });
  const json = (await res.json()) as { result?: string; error?: { message: string } };
  if (json.error || !json.result) throw new Error(json.error?.message ?? "Could not read the Base balance");
  return BigInt(json.result);
}
