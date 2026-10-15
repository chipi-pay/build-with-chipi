"use client";

import { useEffect, useState } from "react";
import { buildRevokeSessionKeyCall, buildSessionSetupCalls } from "@chipi-stack/backend";
import { useExternalSignerExecute } from "@chipi-stack/nextjs";
import { brambleErrorMessage, requireBrambleAccount, signTypedData, type Bramble } from "@/lib/bramble";
import { getChipiToken } from "@/lib/chipi-token";
import { ALLOWED_ENTRYPOINTS, MAX_CALLS, SPENDING_POLICIES, TOKENS, formatUnits } from "@/lib/config";
import type { BrambleOwner } from "./add-bramble-owner";

interface AgentStatus {
  hired: boolean;
  sessionPublicKey?: string;
  validUntil?: number;
  onChain?: { isActive: boolean; remainingCalls: number; validUntil: number };
}

async function fetchStatus(): Promise<AgentStatus> {
  return (await (await fetch("/api/agent/session")).json()) as AgentStatus;
}

const TOKEN_NAMES: Record<string, { symbol: string; decimals: number }> = {
  [TOKENS.USDC]: { symbol: "USDC", decimals: 6 },
  [TOKENS.ETH]: { symbol: "ETH", decimals: 18 },
  [TOKENS.STRK]: { symbol: "STRK", decimals: 18 },
};

/**
 * Bramble, now a co-owner, approves (and later revokes) an agent's session
 * key and its caps. Bramble signs an Approval typed data; Chipi relays it
 * gaslessly. No passkey prompt, and the passkey's key is never decrypted.
 */
export function ApproveAgentSession({
  bramble,
  userId,
  walletAddress,
  owner,
}: {
  bramble: Bramble;
  userId: string;
  walletAddress: string;
  owner: BrambleOwner;
}) {
  const { executeAsync } = useExternalSignerExecute();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [pending, setPending] = useState<{ sessionPublicKey: string; validUntil: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Signs `calls` with Bramble as owner `owner.ownerId`, relays them, and lets the server check the chain. */
  const approveWithBramble = async (calls: ReturnType<typeof buildSessionSetupCalls>, active: boolean) => {
    await requireBrambleAccount(bramble, userId);
    const bearerToken = await getChipiToken();
    if (!bearerToken) throw new Error("Your session expired. Sign in again.");
    const txHash = await executeAsync({
      params: {
        walletAddress,
        ownerIndex: owner.ownerId,
        calls,
        // Bramble shows the wallet and a hash, not the calls: this page shows them (below).
        signTypedData: (typedData) => signTypedData(bramble, typedData),
        // Checked off-chain first, so a wrong account fails here and not on-chain.
        signer: { address: userId, starkPubkey: owner.starkPubkey },
      },
      bearerToken,
    });
    setMessage("Sent. Waiting for Starknet…");
    // The server waits for the receipt and reads the session from the wallet contract.
    const res = await fetch("/api/agent/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active, txHash }),
    });
    if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);
  };

  // Click 1: the server creates the session key (no prompt).
  const prepare = async () => {
    setMessage(null);
    const res = await fetch("/api/agent/session", { method: "POST" });
    if (!res.ok) return setMessage(((await res.json()) as { error: string }).error);
    setPending((await res.json()) as { sessionPublicKey: string; validUntil: number });
  };

  // Click 2: Bramble approves the session and every cap in one signature.
  const approve = async () => {
    if (!pending) return;
    setBusy(true);
    setMessage(null);
    try {
      const calls = buildSessionSetupCalls(
        walletAddress,
        { ...pending, maxCalls: MAX_CALLS, allowedEntrypoints: ALLOWED_ENTRYPOINTS },
        SPENDING_POLICIES
      );
      await approveWithBramble(calls, true);
      setPending(null);
      setMessage("Agent session approved by Bramble.");
    } catch (err) {
      setMessage(brambleErrorMessage(err));
    }
    setStatus(await fetchStatus());
    setBusy(false);
  };

  const revoke = async () => {
    if (!status?.sessionPublicKey) return;
    setBusy(true);
    setMessage(null);
    try {
      await approveWithBramble([buildRevokeSessionKeyCall(walletAddress, status.sessionPublicKey)], false);
      setMessage("Agent session revoked by Bramble.");
    } catch (err) {
      setMessage(brambleErrorMessage(err));
    }
    setStatus(await fetchStatus());
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {status?.hired ? (
        <>
          <p className="text-sm">
            Session active · {status.onChain?.remainingCalls} calls left · until{" "}
            {status.onChain ? new Date(status.onChain.validUntil * 1000).toLocaleString() : "?"}
          </p>
          <button onClick={revoke} disabled={busy} className="rounded border border-red-500 px-4 py-2 text-red-400 disabled:opacity-60">
            {busy ? "Waiting for Bramble…" : "Revoke with Bramble"}
          </button>
        </>
      ) : !pending ? (
        <button onClick={prepare} className="rounded bg-white px-4 py-2 text-black">
          Prepare an agent session
        </button>
      ) : (
        <>
          <div className="rounded bg-zinc-900 p-3 text-sm">
            <p>Bramble is asked to approve, on {walletAddress.slice(0, 10)}…:</p>
            <ul className="ml-4 list-disc">
              <li>
                session key {pending.sessionPublicKey.slice(0, 10)}…, {MAX_CALLS} calls, until{" "}
                {new Date(pending.validUntil * 1000).toLocaleString()}, only {ALLOWED_ENTRYPOINTS.join(", ")}
              </li>
              {SPENDING_POLICIES.map((p) => (
                <li key={p.token}>
                  {TOKEN_NAMES[p.token].symbol}: at most {formatUnits(p.maxPerCall, TOKEN_NAMES[p.token].decimals)} per call,{" "}
                  {formatUnits(p.maxPerWindow, TOKEN_NAMES[p.token].decimals)} per day
                </li>
              ))}
            </ul>
          </div>
          <button onClick={approve} disabled={busy} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
            {busy ? "Waiting for Bramble…" : "Approve with Bramble"}
          </button>
        </>
      )}
      {message && <p className="text-sm text-zinc-300">{message}</p>}
    </div>
  );
}
