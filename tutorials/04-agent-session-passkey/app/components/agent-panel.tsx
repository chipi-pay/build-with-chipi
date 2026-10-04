"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getWalletEncryptKey, useChipiSession, type ChipiWalletData } from "@chipi-stack/nextjs";
import { ALLOWED_ENTRYPOINTS, MAX_CALLS, SPENDING_POLICIES } from "@/lib/limits";

interface AgentStatus {
  hired: boolean;
  sessionPublicKey?: string;
  onChain?: { isActive: boolean; remainingCalls: number; validUntil: number };
  decisions?: Array<{ at: string; action: string; reason: string; txHash?: string; success?: boolean }>;
}

async function fetchStatus(): Promise<AgentStatus> {
  const res = await fetch("/api/agent/status");
  return (await res.json()) as AgentStatus;
}

export function AgentPanel({ wallet }: { wallet: ChipiWalletData }) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ticking, setTicking] = useState(false);

  const { registerSession, revokeSession, supportsSession, isRegistering, isRevoking } = useChipiSession({
    wallet,
    // The passkey prompt happens only when an action needs the owner key.
    getEncryptKey: () => getWalletEncryptKey(),
    getBearerToken: () => getToken({ skipCache: true }),
    autoCheckStatus: false,
  });

  const refresh = useCallback(async () => {
    setStatus(await fetchStatus());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hire = async () => {
    setMessage(null);
    try {
      // 1. The server creates the session key and keeps the private half.
      const created = await fetch("/api/agent/session", { method: "POST" });
      const { sessionPublicKey, validUntil } = (await created.json()) as {
        sessionPublicKey: string;
        validUntil: number;
      };

      // 2. One passkey prompt: session + every cap in one transaction.
      const txHash = await registerSession({
        sessionPublicKey,
        validUntil,
        maxCalls: MAX_CALLS,
        allowedEntrypoints: ALLOWED_ENTRYPOINTS,
        spendingPolicies: SPENDING_POLICIES,
      });

      // 3. The server checks the chain before it starts using the session.
      const confirmed = await fetch("/api/agent/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true, txHash }),
      });
      if (!confirmed.ok) throw new Error(((await confirmed.json()) as { error: string }).error);
      setMessage("Agent hired.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }
    await refresh();
  };

  const tick = async () => {
    setTicking(true);
    setMessage(null);
    const res = await fetch("/api/agent/tick", { method: "POST" });
    const body = (await res.json()) as { action?: string; txHash?: string; success?: boolean; error?: string };
    setMessage(body.error ?? (body.txHash ? `${body.action}: ${body.success ? "confirmed" : "failed"} ${body.txHash}` : "hold"));
    setTicking(false);
    await refresh();
  };

  const stop = async () => {
    if (!status?.sessionPublicKey) return;
    setMessage(null);
    try {
      // One passkey prompt. The browser never held the session: pass its key.
      const txHash = await revokeSession(status.sessionPublicKey);
      await fetch("/api/agent/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false, txHash }),
      });
      setMessage("Agent stopped.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }
    await refresh();
  };

  if (!supportsSession) return <p>This wallet can&apos;t use an agent.</p>;

  return (
    <section className="flex flex-col gap-4 rounded border border-zinc-800 p-4">
      <p className="font-mono text-xs text-zinc-400">{wallet.publicKey}</p>

      {!status?.hired ? (
        <button onClick={hire} disabled={isRegistering} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
          {isRegistering ? "Waiting for your passkey…" : "Hire agent"}
        </button>
      ) : (
        <>
          <p className="text-sm">
            Active · {status.onChain?.remainingCalls} calls left · until{" "}
            {status.onChain ? new Date(status.onChain.validUntil * 1000).toLocaleString() : "?"}
          </p>
          <div className="flex gap-2">
            <button onClick={tick} disabled={ticking} className="rounded bg-zinc-200 px-4 py-2 text-black disabled:opacity-60">
              {ticking ? "Thinking…" : "Run one decision"}
            </button>
            <button onClick={stop} disabled={isRevoking} className="rounded border border-red-500 px-4 py-2 text-red-400 disabled:opacity-60">
              {isRevoking ? "Waiting for your passkey…" : "Stop agent"}
            </button>
          </div>
        </>
      )}

      {message && <p className="text-sm text-zinc-300">{message}</p>}

      {status?.decisions && status.decisions.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {status.decisions.map((d) => (
            <li key={d.at} className="rounded bg-zinc-900 p-2">
              <span className="font-medium">{d.action}</span> · {d.reason}
              {d.txHash && (
                <a className="ml-1 underline" href={`https://voyager.online/tx/${d.txHash}`} target="_blank" rel="noreferrer">
                  {d.success ? "tx" : "failed"}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
