"use client";

import { useEffect, useState } from "react";
import { useChipiWallet } from "@chipi-stack/nextjs";
import { waitForBramble, type Bramble } from "@/lib/bramble";
import { getChipiToken } from "@/lib/chipi-token";
import { shortAddress } from "@/lib/config";
import { SignInWithBramble } from "./sign-in-with-bramble";
import { CreatePasskeyWallet } from "./create-passkey-wallet";
import { FundFromBramble } from "./fund-from-bramble";
import { AddBrambleOwner, type BrambleOwner } from "./add-bramble-owner";
import { ApproveAgentSession } from "./approve-agent-session";

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
  // undefined = still looking (Bramble can inject after the page loads).
  const [bramble, setBramble] = useState<Bramble | null | undefined>(undefined);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [owner, setOwner] = useState<BrambleOwner | null>(null);

  useEffect(() => {
    let cancelled = false;
    waitForBramble().then((found) => {
      if (!cancelled) setBramble(found);
    });
    fetch("/api/auth/session")
      .then((res) => res.json() as Promise<{ address: string | null }>)
      .then(({ address }) => {
        if (!cancelled) setUserId(address);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The Bramble address is the user id: the JWT's `sub`, Chipi's externalUserId.
  const { wallet, isLoadingWallet, refetchWallet } = useChipiWallet({
    externalUserId: userId ?? null,
    getBearerToken: getChipiToken,
    enabled: Boolean(userId),
  });

  const signOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUserId(null);
    setOwner(null);
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Bramble as a trusted wallet</h1>
      <p className="text-sm text-zinc-400">
        Sign in with Bramble, fund a Chipi passkey wallet from it, make Bramble a co-owner, then let Bramble approve a
        capped agent session. Starknet mainnet only.
      </p>

      {bramble === undefined && <p className="text-sm text-zinc-400">Looking for Bramble…</p>}
      {bramble === null && (
        <p className="text-sm text-red-400">
          Bramble isn&apos;t installed in this browser (or this page isn&apos;t https or localhost). Install it, then reload.
        </p>
      )}

      {bramble && userId === null && (
        <Step n={2} title="Sign in with Bramble">
          <SignInWithBramble bramble={bramble} onSignedIn={setUserId} />
        </Step>
      )}

      {bramble && userId && (
        <>
          <p className="text-sm">
            Signed in as <span className="font-mono">{shortAddress(userId)}</span>{" "}
            <button onClick={signOut} className="underline">
              sign out
            </button>
          </p>

          <Step n={3} title="Create the Chipi wallet (passkey)">
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
              <Step n={4} title="Fund it from Bramble">
                <FundFromBramble bramble={bramble} brambleAddress={userId} walletAddress={wallet.publicKey} />
              </Step>
              <Step n={5} title="Make Bramble a co-owner">
                <AddBrambleOwner bramble={bramble} userId={userId} wallet={wallet} onOwner={setOwner} />
              </Step>
              <Step n={6} title="Bramble approves an agent session">
                {owner ? (
                  <ApproveAgentSession bramble={bramble} userId={userId} walletAddress={wallet.publicKey} owner={owner} />
                ) : (
                  <p className="text-sm text-zinc-400">Available once Bramble is a co-owner (step 5).</p>
                )}
              </Step>
            </>
          )}
        </>
      )}
    </main>
  );
}
