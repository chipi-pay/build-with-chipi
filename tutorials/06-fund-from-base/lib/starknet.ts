import { RpcProvider } from "starknet";
import { RPC_URL } from "./config";

/** Mainnet reads: the Chipi wallet's USDC balance, before and after the deposit. */
export const provider = new RpcProvider({ nodeUrl: RPC_URL });

export async function balanceOf(token: string, owner: string): Promise<bigint> {
  const [low, high] = await provider.callContract({
    contractAddress: token,
    entrypoint: "balance_of",
    calldata: [owner],
  });
  return BigInt(low) + (BigInt(high) << 128n);
}
