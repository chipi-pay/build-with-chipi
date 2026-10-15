import { RpcProvider } from "starknet";
import { RPC_URL } from "./config";

/**
 * Mainnet reads: balances, the Chipi wallet's owners and verifier classes,
 * and Bramble's public key. An `RpcProvider` has the `callContract` and
 * `getClassByHash` the SDK's readers ask for.
 */
export const provider = new RpcProvider({ nodeUrl: RPC_URL });

export async function balanceOf(token: string, owner: string): Promise<bigint> {
  const [low, high] = await provider.callContract({
    contractAddress: token,
    entrypoint: "balance_of",
    calldata: [owner],
  });
  return BigInt(low) + (BigInt(high) << 128n);
}
