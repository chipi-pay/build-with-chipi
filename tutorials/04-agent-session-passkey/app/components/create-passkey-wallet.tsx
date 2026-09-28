"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Chain, createWalletPasskey, PrfUnsupportedError, useCreateWallet } from "@chipi-stack/nextjs";

/**
 * A self-custodial SHHH wallet whose key is encrypted with the passkey's PRF
 * secret. Neither Chipi nor this app can decrypt it.
 */
export function CreatePasskeyWallet({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const { getToken } = useAuth();
  const { createWalletAsync, isLoading } = useCreateWallet();
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    try {
      // Face ID / fingerprint. Throws PrfUnsupportedError on authenticators
      // without WebAuthn PRF instead of creating a custodial wallet.
      const { encryptKey } = await createWalletPasskey(userId, userId);

      // Fresh token after the prompt: a token fetched before it may expire
      // while the user is on the biometric sheet.
      const bearerToken = await getToken({ skipCache: true });
      if (!bearerToken) throw new Error("Not signed in");

      await createWalletAsync({
        params: { encryptKey, externalUserId: userId, chain: Chain.STARKNET, walletType: "SHHH" },
        bearerToken,
      });
      onCreated();
    } catch (err) {
      if (err instanceof PrfUnsupportedError) {
        setError("This device can't secure a wallet. Use a recent iPhone or Android, or a password manager with passkeys.");
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="rounded border border-zinc-800 p-4">
      <button onClick={create} disabled={isLoading} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
        {isLoading ? "Creating…" : "Create wallet with passkey"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
