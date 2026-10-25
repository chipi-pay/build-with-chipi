"use client";

import { useEffect, useState } from "react";
import { useChipiWallet } from "@chipi-stack/nextjs";
import type { EvmWalletDetail } from "@chipi-stack/backend";
import { getChipiToken } from "@/lib/chipi-token";
import { shortAddress } from "@/lib/config";
import { CreatePasskeyWallet } from "./create-passkey-wallet";
import { PickEvmWallet, type ConnectedEvmWallet } from "./pick-evm-wallet";
import { FundFromBase } from "./fund-from-base";
import { DepositProgress } from "./deposit-progress";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded border border-zinc-800 p-4">
      <h2 className="font-medium">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

export function Tutorial() {
  // undefined = still asking the server who is signed in.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [evm, setEvm] = useState<ConnectedEvmWallet | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json() as Promise<{ userId: string | null }>)
      .then(({ userId }) => {
        if (!cancelled) setUserId(userId);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The anonymous id is the user id: the JWT's `sub`, Chipi's externalUserId.
  const { wallet, isLoadingWallet, refetchWallet } = useChipiWallet({
    externalUserId: userId ?? null,
    getBearerToken: getChipiToken,
    enabled: Boolean(userId),
  });

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/auth/anonymous", { method: "POST" });
      // A 500 here is usually APP_SECRET missing or shorter than 32 characters.
      if (!res.ok) throw new Error(`The server could not start a session (${res.status}). Check APP_SECRET and APP_JWT_PRIVATE_KEY in .env.local.`);
      setUserId(((await res.json()) as { userId: string }).userId);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUserId(null);
    setEvm(null);
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Fund a Chipi wallet from Base</h1>
      <p className="text-sm text-zinc-400">
        Create a passkey wallet on Starknet, then bring USDC you hold on Base into it with Circle&apos;s CCTP. You see both
        speeds and prices before signing, and you can close the page while it arrives. Mainnet only.
      </p>

      {userId === undefined && <p className="text-sm text-zinc-400">Loading…</p>}

      {userId === null && (
        <Step n={1} title="Start">
          <p className="text-sm text-zinc-400">
            An anonymous account: a random id in a cookie. The passkey you create next is what really identifies you.
          </p>
          <button onClick={start} disabled={starting} className="w-fit rounded bg-white px-4 py-2 text-black disabled:opacity-60">
            {starting ? "Starting…" : "Start"}
          </button>
          {startError && <p className="text-sm text-red-400">{startError}</p>}
        </Step>
      )}

      {userId && (
        <>
          <p className="text-sm">
            Account <span className="font-mono">{userId}</span>{" "}
            <button onClick={signOut} className="underline">
              sign out
            </button>
          </p>

          <Step n={2} title="Create the Chipi wallet (passkey)">
            {isLoadingWallet ? (
              <p className="text-sm text-zinc-400">Loading wallet…</p>
            ) : wallet ? (
              <p className="font-mono text-xs text-zinc-400">{wallet.publicKey}</p>
            ) : (
              <CreatePasskeyWallet userId={userId} onCreated={() => refetchWallet()} />
            )}
          </Step>

          {wallet && (
            <>
              <Step n={3} title="Pick the wallet that holds your USDC on Base">
                {evm ? (
                  <p className="text-sm text-zinc-400">
                    {evm.wallet.info.name}: <span className="font-mono">{shortAddress(evm.account)}</span>{" "}
                    <button onClick={() => setEvm(null)} className="underline">
                      change
                    </button>
                  </p>
                ) : (
                  <PickEvmWallet onConnected={setEvm} />
                )}
              </Step>
              <Step n={4} title="Bring USDC">
                {evm ? (
                  <FundFromBase evm={evm} chipiWallet={wallet.publicKey} />
                ) : (
                  <p className="text-sm text-zinc-400">Pick a Base wallet first (step 3).</p>
                )}
              </Step>
              <Step n={5} title="Follow it, from any device">
                <DepositProgress chipiWallet={wallet.publicKey} />
              </Step>
            </>
          )}
        </>
      )}
    </main>
  );
}

export type { EvmWalletDetail };
