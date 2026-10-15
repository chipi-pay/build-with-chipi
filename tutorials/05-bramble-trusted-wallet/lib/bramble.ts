"use client";

import { MAINNET_CHAIN_ID, TOKENS, normalizeAddress } from "./config";

/**
 * Bramble's injected provider, `window.starknet_bramble`, and the rules from
 * its integration guide (v0.10.5):
 *
 * - it can appear after page load: wait for `starknet#initialized`;
 * - prompts open only from a click, and stay pending until the user decides;
 * - params are parsed strictly: no `undefined` values, no extra keys
 *   (`wallet_addInvokeTransaction` takes `calls` only: no fee, no paymaster);
 * - typed data must name the active chain (`SN_MAIN`) in its domain;
 * - lowercase hex addresses;
 * - 113 = the user declined (or the prompt expired), 163 = locked, site not
 *   connected, or refused. Offer a retry button; never auto-retry.
 */

type WalletRequest = (call: { type: string; params?: unknown }) => Promise<unknown>;

export interface Bramble {
  id: string;
  name: string;
  request: WalletRequest;
}

const USER_REFUSED = 113;
const REFUSED_OR_LOCKED = 163;

export class BrambleError extends Error {}

/** Resolves with Bramble, or null if it hasn't injected within `timeoutMs`. */
export function waitForBramble(timeoutMs = 3000): Promise<Bramble | null> {
  return new Promise((resolve) => {
    const found = () => (window as unknown as { starknet_bramble?: Bramble }).starknet_bramble ?? null;
    if (found()) return resolve(found());
    const done = () => {
      clearInterval(poll);
      clearTimeout(timer);
      window.removeEventListener("starknet#initialized", check);
      resolve(found());
    };
    const check = () => {
      if (found()) done();
    };
    window.addEventListener("starknet#initialized", check);
    const poll = setInterval(check, 100);
    const timer = setTimeout(done, timeoutMs);
  });
}

/** A sentence a person can act on. */
export function brambleErrorMessage(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  if (code === USER_REFUSED) return "You declined the request in Bramble.";
  if (code === REFUSED_OR_LOCKED) return "Bramble refused the request. Unlock it, check this site is connected, and try again.";
  return err instanceof Error && err.message ? err.message : "Bramble couldn't complete the request.";
}

/**
 * Asks Bramble for its account (a prompt if this site isn't connected yet)
 * and checks it is on mainnet. Call it from a click.
 */
export async function connectBramble(bramble: Bramble): Promise<string> {
  const accounts = (await bramble.request({ type: "wallet_requestAccounts", params: { silent_mode: false } })) as string[];
  if (!accounts?.length) throw new BrambleError("Unlock Bramble and try again.");
  const chainId = (await bramble.request({ type: "wallet_requestChainId" })) as string;
  if (BigInt(chainId) !== BigInt(MAINNET_CHAIN_ID)) throw new BrambleError("Switch Bramble to Starknet Mainnet.");
  return normalizeAddress(accounts[0]);
}

/**
 * The account Bramble shows this site right now, without a prompt. Bramble
 * shows one account per site: if the user switched to another one, this
 * returns a different address, or none.
 */
export async function requireBrambleAccount(bramble: Bramble, expected: string): Promise<void> {
  const accounts = (await bramble.request({ type: "wallet_requestAccounts", params: { silent_mode: true } })) as string[];
  if (!accounts?.length) throw new BrambleError("Unlock Bramble (and connect this site) to continue.");
  if (normalizeAddress(accounts[0]) !== normalizeAddress(expected)) {
    throw new BrambleError(`Select the account ${expected.slice(0, 8)}… in Bramble.`);
  }
}

/** `wallet_signTypedData`: a SNIP-12 signature, as felts. */
export async function signTypedData(bramble: Bramble, typedData: unknown): Promise<string[]> {
  const signature = (await bramble.request({ type: "wallet_signTypedData", params: typedData })) as unknown[];
  if (!Array.isArray(signature) || signature.length === 0) throw new BrambleError("Bramble returned no signature.");
  return signature.map((felt) => String(felt));
}

export interface DeploymentData {
  address: string;
  class_hash: string;
  salt: string;
  calldata: string[];
}

/**
 * What a new (not yet deployed) Bramble account will deploy as. Bramble
 * answers 115 for a deployed account: then there is nothing to send, and the
 * server asks the account contract itself.
 */
export async function deploymentData(bramble: Bramble): Promise<DeploymentData | undefined> {
  try {
    const data = (await bramble.request({ type: "wallet_deploymentData" })) as Partial<DeploymentData> | null;
    if (!data?.address || !data.class_hash || !Array.isArray(data.calldata)) return undefined;
    return {
      address: String(data.address),
      class_hash: String(data.class_hash),
      salt: String(data.salt ?? "0x0"),
      calldata: data.calldata.map(String),
    };
  } catch {
    return undefined;
  }
}

/**
 * One USDC `transfer` that Bramble shows, signs and pays the fee for (in
 * STRK). Returns the hash: wait for it before you count the deposit.
 */
export async function sendUsdc(bramble: Bramble, to: string, units: bigint): Promise<string> {
  const low = units & ((1n << 128n) - 1n);
  const high = units >> 128n;
  const result = (await bramble.request({
    type: "wallet_addInvokeTransaction",
    params: {
      // Exactly `calls`: any other key (fee, max_fee, paymaster) fails with 114.
      calls: [
        {
          contract_address: normalizeAddress(TOKENS.USDC),
          entry_point: "transfer",
          // u256 = two felts, low then high.
          calldata: [normalizeAddress(to), `0x${low.toString(16)}`, `0x${high.toString(16)}`],
        },
      ],
    },
  })) as { transaction_hash?: string } | null;
  if (!result?.transaction_hash) throw new BrambleError("Bramble didn't send the transfer.");
  return result.transaction_hash;
}
