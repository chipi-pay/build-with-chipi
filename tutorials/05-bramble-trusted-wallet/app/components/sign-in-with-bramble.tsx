"use client";

import { useState } from "react";
import { brambleErrorMessage, connectBramble, deploymentData, signTypedData, type Bramble } from "@/lib/bramble";
import { shortAddress } from "@/lib/config";

type Issued = { nonce: string; typedData: unknown };

/**
 * Sign in with Starknet, two clicks on purpose: the first connects Bramble,
 * the second asks for the signature. Bramble opens its panel only from a
 * click, so each prompt gets its own.
 */
export function SignInWithBramble({ bramble, onSignedIn }: { bramble: Bramble; onSignedIn: (address: string) => void }) {
  const [connected, setConnected] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const address = await connectBramble(bramble);
      const res = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);
      setIssued((await res.json()) as Issued);
      setConnected(address);
    } catch (err) {
      setError(brambleErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    if (!connected || !issued) return;
    setBusy(true);
    setError(null);
    try {
      // A new Bramble account isn't deployed yet: its deployment data lets the
      // server check the signature without an account contract to ask.
      const deployment = await deploymentData(bramble);
      const signature = await signTypedData(bramble, issued.typedData);
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce: issued.nonce, signature, ...(deployment ? { deploymentData: deployment } : {}) }),
      });
      const body = (await res.json()) as { address?: string; error?: string };
      if (!res.ok || !body.address) {
        // The nonce is spent either way: start over with a fresh one.
        setIssued(null);
        setConnected(null);
        throw new Error(body.error ?? "The signature didn't check out.");
      }
      onSignedIn(body.address);
    } catch (err) {
      setError(brambleErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!connected ? (
        <button onClick={connect} disabled={busy} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
          {busy ? "Waiting for Bramble…" : "Connect Bramble"}
        </button>
      ) : (
        <>
          <p className="text-sm text-zinc-400">
            Connected {shortAddress(connected)}. Sign the message in Bramble: it costs nothing and moves no funds.
          </p>
          <button onClick={signIn} disabled={busy} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
            {busy ? "Waiting for Bramble…" : "Sign in with Bramble"}
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
