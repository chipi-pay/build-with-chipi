"use client";

import { useState } from "react";
import { Chain, useCreateWallet } from "@chipi-stack/nextjs";
import { getChipiToken } from "@/lib/chipi-token";

/**
 * A self-custodial SHHH wallet whose key is encrypted with the passkey's PRF
 * secret. Neither Chipi, this app nor Bramble can decrypt it. Passkey only,
 * no PIN.
 */
export function CreatePasskeyWallet({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const { createWalletAsync, isLoading } = useCreateWallet();
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    try {
      const bearerToken = await getChipiToken();
      if (!bearerToken) throw new Error("Your session expired. Sign in again.");
      // Face ID / fingerprint. The passkey's PRF output encrypts the key.
      await createWalletAsync({
        params: { externalUserId: userId, chain: Chain.STARKNET, walletType: "SHHH", usePasskey: true },
        bearerToken,
      });
      onCreated();
    } catch (err) {
      // On an authenticator without WebAuthn PRF the hook refuses instead of
      // creating a wallet the server could decrypt.
      if ((err as { code?: unknown }).code === "PRF_UNSUPPORTED") {
        setError("This device can't secure a wallet. Use a recent iPhone or Android, or a password manager with passkeys.");
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button onClick={create} disabled={isLoading} className="rounded bg-white px-4 py-2 text-black disabled:opacity-60">
        {isLoading ? "Creating…" : "Create wallet with passkey"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
