"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useChipiWallet } from "@chipi-stack/nextjs";
import { CreatePasskeyWallet } from "./create-passkey-wallet";
import { AgentPanel } from "./agent-panel";

export function AgentDashboard() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { wallet, isLoadingWallet, refetchWallet } = useChipiWallet({
    externalUserId: userId ?? null,
    getBearerToken: getToken,
    enabled: Boolean(isSignedIn),
  });

  if (!isLoaded) return null;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Hire an agent for your wallet</h1>
      <p className="text-sm text-zinc-400">
        One passkey prompt to hire it, one to stop it. In between, it trades on its own inside limits
        the wallet contract enforces.
      </p>

      {!isSignedIn && (
        <SignInButton>
          <button className="rounded bg-white px-4 py-2 text-black">Sign in</button>
        </SignInButton>
      )}

      {isSignedIn && userId && isLoadingWallet && <p>Loading wallet…</p>}

      {isSignedIn && userId && !isLoadingWallet && !wallet && (
        <CreatePasskeyWallet userId={userId} onCreated={() => refetchWallet()} />
      )}

      {isSignedIn && wallet && <AgentPanel wallet={wallet} />}
    </main>
  );
}
